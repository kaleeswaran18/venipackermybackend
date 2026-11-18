const mongoose = require("mongoose");

const CustomerDelivery = require("./customerDelivery.model");
const Tax = require("../tax/tax.model");
const taxService = require("../tax/tax.service");
const FinishedMaterialProductStock = require(
  "../finished-material-product-stock/finished-material-product-stock.model"
);

// =========================
// GET ALL
// =========================

const getCustomerDeliveries = async () => {
  const deliveries = await CustomerDelivery.find()
    .populate({
      path: "orderId",
      populate: {
        path: "assignedLocation",
        select: "name",
      },
    })
    .populate("companyId", "companyName")
    .sort({ createdAt: -1 });

  return deliveries;
};

// =========================
// GET BY ID
// =========================

const getCustomerDeliveryById = async (id) => {
  const delivery = await CustomerDelivery.findById(id)
    .populate({
      path: "orderId",
      populate: {
        path: "assignedLocation",
        select: "name",
      },
    })
    .populate("companyId", "companyName");

  if (!delivery) {
    throw new Error("Customer delivery not found.");
  }

  return delivery;
};

// =========================
// UPDATE
// =========================

const updateCustomerDelivery = async (id, data) => {
  const session = await mongoose.startSession();
  let updatedDelivery;

  try {
    await session.withTransaction(async () => {
      const delivery = await CustomerDelivery.findById(id).session(session);

  if (!delivery) {
    throw new Error("Customer delivery not found.");
  }

  const oldStatus = delivery.deliveryStatus;

  // Get assigned location
  await delivery.populate({
    path: "orderId",
    select: "assignedLocation",
    options: { session },
  });

  const locationId =
    delivery.orderId?.assignedLocation?._id ||
    delivery.orderId?.assignedLocation;

  if (data.products !== undefined) {
    if (!locationId) {
      const error = new Error(
        "Assigned location not found. Cannot update delivery stock."
      );
      error.statusCode = 400;
      throw error;
    }

    // =========================================
    // STEP 1: PREPARE STOCK DIFFERENCES
    // =========================================

    const stockChanges = new Map();
    const fieldUpdates = [];

    data.products.forEach((updatedProduct) => {
      const existingProduct = delivery.products.id(
        updatedProduct._id
      );

      if (!existingProduct || updatedProduct.fields === undefined) {
        return;
      }

      updatedProduct.fields.forEach((updatedField) => {
        const existingField = existingProduct.fields.find(
          (field) =>
            field.fieldId.toString() ===
            updatedField.fieldId.toString()
        );

        if (
          !existingField ||
          updatedField.deliveredQuantity === undefined
        ) {
          return;
        }

        const newDeliveredQuantity = Number(
          updatedField.deliveredQuantity
        );

        const alreadyDeductedQuantity = Number(
          existingField.stockDeductedQuantity || 0
        );

        if (
          !Number.isFinite(newDeliveredQuantity) ||
          newDeliveredQuantity < 0
        ) {
          const error = new Error(
            `Invalid delivered quantity for ${existingProduct.productName} - ${existingField.fieldName}.`
          );
          error.statusCode = 400;
          throw error;
        }

        // Old records have stockDeductedQuantity = 0.
        // First update deducts the full delivered quantity.
        const difference =
          newDeliveredQuantity - alreadyDeductedQuantity;

        const categoryId =
          existingProduct.finishedMaterialCategoryId.toString();

        const productId =
          existingProduct.productId.toString();

        const fieldKey = String(
          existingField.fieldName || ""
        )
          .trim()
          .toLowerCase();

        if (!fieldKey) {
          const error = new Error(
            `Stock field name missing for ${existingProduct.productName}.`
          );
          error.statusCode = 400;
          throw error;
        }

        if (difference !== 0) {
          const key =
            `${categoryId}|${productId}|${locationId.toString()}|${fieldKey}`;

          const current = stockChanges.get(key);

          stockChanges.set(key, {
            categoryId,
            productId,
            locationId: locationId.toString(),
            fieldKey,
            difference:
              difference +
              Number(current?.difference || 0),
            productName: existingProduct.productName,
            fieldName: existingField.fieldName,
          });
        }

        fieldUpdates.push({
          existingField,
          newDeliveredQuantity,
          pendingQuantity: updatedField.pendingQuantity,
        });
      });
    });

    // =========================================
    // STEP 2: VALIDATE ALL STOCK
    // =========================================

    const stockRecords = new Map();

    for (const [key, change] of stockChanges.entries()) {
      const stock = await FinishedMaterialProductStock.findOne({
        categoryId: change.categoryId,
        productId: change.productId,
        locationId: change.locationId,
      }).session(session);

      if (!stock) {
        const error = new Error(
          `Stock record not found for ${change.productName} - ${change.fieldName}.`
        );
        error.statusCode = 400;
        throw error;
      }

      const available = Number(
        stock.values?.get(change.fieldKey) || 0
      );

      if (
        change.difference > 0 &&
        available < change.difference
      ) {
        const error = new Error(
          `Stock not available for ${change.productName} - ${change.fieldName}. Required: ${change.difference}, Available: ${available}.`
        );

        error.statusCode = 400;

        error.details = {
          productName: change.productName,
          fieldName: change.fieldName,
          required: change.difference,
          available,
        };

        throw error;
      }

      stockRecords.set(key, stock);
    }

    // =========================================
    // STEP 3: UPDATE STOCK
    // =========================================

    for (const [key, change] of stockChanges.entries()) {
      const stock = stockRecords.get(key);

      const currentValue = Number(
        stock.values?.get(change.fieldKey) || 0
      );

      const nextValue =
        currentValue - change.difference;

      // Positive difference = reduce stock
      // Negative difference = add stock back
      stock.values.set(
        change.fieldKey,
        nextValue
      );

      await stock.save({ session });
    }

    // =========================================
    // STEP 4: UPDATE DELIVERY QUANTITIES
    // =========================================

    fieldUpdates.forEach((update) => {
      update.existingField.deliveredQuantity =
        update.newDeliveredQuantity;

      update.existingField.stockDeductedQuantity =
        update.newDeliveredQuantity;

      if (update.pendingQuantity !== undefined) {
        update.existingField.pendingQuantity =
          update.pendingQuantity;
      }
    });
  }

  // =========================
  // EXPECTED DELIVERY DATE
  // =========================

  if (data.expectedDeliveryDate !== undefined) {
    delivery.expectedDeliveryDate =
      data.expectedDeliveryDate;
  }

  // =========================
  // ACTUAL DELIVERY DATE
  // =========================

  if (data.actualDeliveryDate !== undefined) {
    delivery.actualDeliveryDate =
      data.actualDeliveryDate;
  }

  // =========================
  // DELIVERY STATUS
  // =========================

  if (data.deliveryStatus !== undefined) {
    delivery.deliveryStatus =
      data.deliveryStatus;
  }

  // =========================
  // TAX AMOUNT
  // =========================

  if (data.taxAmount !== undefined) {
    delivery.taxAmount =
      Number(data.taxAmount) || 0;
  }

  // =========================
  // REMARKS
  // =========================

  if (data.remarks !== undefined) {
    delivery.remarks = data.remarks;
  }

  // =========================
  // SAVE CUSTOMER DELIVERY
  // =========================

  await delivery.save({ session });

  // ==================================================
  // TAX LOGIC
  // ==================================================

  // ------------------------------------------
  // CASE 1:
  // Any Status → Delivered
  // Create Tax DEBIT Record
  // ------------------------------------------

  if (
    oldStatus !== "Delivered" &&
    delivery.deliveryStatus === "Delivered"
  ) {
    await taxService.createTax({
      transactionDate: new Date(),
      transactionType: "DEBIT",
      taxAmount: delivery.taxAmount || 0,
      sourceType: "Delivery",
      sourceId: delivery._id,
      remarks: `Tax debit for delivery ${delivery.deliveryNo}`,
    }, { session });
  }

  // ------------------------------------------
  // CASE 2:
  // Delivered → Any Other Status
  // Delete Existing Tax DEBIT Record
  // ------------------------------------------

  if (
    oldStatus === "Delivered" &&
    delivery.deliveryStatus !== "Delivered"
  ) {
    const taxRecord = await Tax.findOne({
      transactionType: "DEBIT",
      sourceType: "Delivery",
      sourceId: delivery._id,
    }).session(session);

    if (taxRecord) {
      await taxService.deleteTax(taxRecord._id, { session });
    }
  }

  // =========================
  // POPULATE RESPONSE
  // =========================

  await delivery.populate({
    path: "orderId",
    populate: {
      path: "assignedLocation",
      select: "name",
    },
    options: { session },
  });

  await delivery.populate(
    {
      path: "companyId",
      select: "companyName",
      options: { session },
    }
  );

      updatedDelivery = delivery;
    });
    return updatedDelivery;
  } finally {
    await session.endSession();
  }
};

// =========================
// EXPORTS
// =========================

module.exports = {
  getCustomerDeliveries,
  getCustomerDeliveryById,
  updateCustomerDelivery,
};
