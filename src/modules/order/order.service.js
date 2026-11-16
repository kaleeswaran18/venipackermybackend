const Order = require("./order.model");

const CustomerDelivery = require("../customerDelivery/customerDelivery.model");

const FinanceCategory = require("../finance-category/finance-category.model");

const {
  createTransaction,
} = require("../finance-transaction/finance-transaction.service");

const SOURCE_MODULE = "individualorderpayment";
const SOURCE_TYPE = "individualorderpayment";

// =========================
// GENERATE ORDER NUMBER
// =========================

const generateOrderNo = async () => {
  const lastOrder = await Order.findOne()
    .sort({ createdAt: -1 })
    .select("orderNo");

  if (!lastOrder) {
    return "ORD001";
  }

  const lastCode = lastOrder.orderNo;

  const number = parseInt(
    lastCode.replace("ORD", ""),
    10
  );

  const nextNumber = number + 1;

  return `ORD${String(nextNumber).padStart(3, "0")}`;
};

// =========================
// FORMAT PRODUCTS
// =========================

const formatProducts = (products) => {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => ({
    ...(product._id
      ? { _id: product._id }
      : {}),

    finishedMaterialCategoryId:
      product.finishedMaterialCategoryId,

    finishedMaterialCategoryName:
      product.finishedMaterialCategoryName,

    productId:
      product.productId,

    productName:
      product.productName,

    size:
      product.size || "",

    fields:
      Array.isArray(product.fields)
        ? product.fields.map((field) => ({
            ...(field._id
              ? { _id: field._id }
              : {}),

            fieldId:
              field.fieldId,

            fieldName:
              field.fieldName,

            requestedQuantity:
              field.requestedQuantity,
          }))
        : [],

    // Store exactly as received
    ratePerPiece:
      product.ratePerPiece,

    // Store exactly as received
    amount:
      product.amount,
  }));
};

// =========================
// CREATE CUSTOMER DELIVERY
// =========================

const createCustomerDeliveryFromOrder = async (order) => {
  const products = order.products.map(
    (product) => ({
      finishedMaterialCategoryId:
        product.finishedMaterialCategoryId,

      finishedMaterialCategoryName:
        product.finishedMaterialCategoryName,

      productId:
        product.productId,

      productName:
        product.productName,

      size:
        product.size || "",

      fields:
        product.fields.map(
          (field) => ({
            fieldId:
              field.fieldId,

            fieldName:
              field.fieldName,

            orderedQuantity:
              field.requestedQuantity,

            deliveredQuantity: 0,

            pendingQuantity:
              field.requestedQuantity,
          })
        ),

      ratePerPiece:
        product.ratePerPiece,

      amount:
        product.amount,
    })
  );

  const customerDelivery =
    await CustomerDelivery.create({
      deliveryNo:
        `DEL-${order.orderNo}`,

      orderId:
        order._id,

      companyId:
        order.companyId,

      customerName:
        order.customerName,

      expectedDeliveryDate:
        order.endDate,

      actualDeliveryDate:
        null,

      deliveryStatus:
        "Pending",

      products,

      remarks: "",
    });

  return customerDelivery;
};

// =========================
// UPDATE CUSTOMER DELIVERY
// FROM ORDER
// =========================

const updateCustomerDeliveryFromOrder =
  async (order) => {
    const customerDelivery =
      await CustomerDelivery.findOne({
        orderId: order._id,
      });

    // Customer Delivery may not exist
    if (!customerDelivery) {
      return null;
    }

    customerDelivery.customerName =
      order.customerName;

    customerDelivery.expectedDeliveryDate =
      order.endDate;

    customerDelivery.products =
      order.products.map(
        (product) => {
          const existingProduct =
            customerDelivery.products.find(
              (existingProduct) =>
                existingProduct.productId
                  ?.toString() ===
                product.productId?.toString()
            );

          return {
            ...(existingProduct?._id
              ? {
                  _id:
                    existingProduct._id,
                }
              : {}),

            finishedMaterialCategoryId:
              product.finishedMaterialCategoryId,

            finishedMaterialCategoryName:
              product.finishedMaterialCategoryName,

            productId:
              product.productId,

            productName:
              product.productName,

            size:
              product.size || "",

            fields:
              product.fields.map(
                (field) => {
                  const existingField =
                    existingProduct?.fields?.find(
                      (existingField) =>
                        existingField.fieldId
                          ?.toString() ===
                        field.fieldId?.toString()
                    );

                  const orderedQuantity =
                    field.requestedQuantity;

                  // Preserve already delivered quantity
                  const deliveredQuantity =
                    existingField
                      ?.deliveredQuantity ?? 0;

                  return {
                    ...(existingField?._id
                      ? {
                          _id:
                            existingField._id,
                        }
                      : {}),

                    fieldId:
                      field.fieldId,

                    fieldName:
                      field.fieldName,

                    orderedQuantity,

                    deliveredQuantity,

                    pendingQuantity:
                      Math.max(
                        orderedQuantity -
                          deliveredQuantity,
                        0
                      ),
                  };
                }
              ),

            // Store exactly as received
            ratePerPiece:
              product.ratePerPiece,

            // Store exactly as received
            amount:
              product.amount,
          };
        }
      );

    await customerDelivery.save();

    return customerDelivery;
  };

// =========================
// INDIVIDUAL ORDER PAYMENT
// FINANCE TRANSACTION HELPERS
// =========================

const getFinancePaymentMethod = (paymentMode) => {
  const paymentMethods = {
    Cash: "cash",
    UPI: "upi",
    "Bank Transfer": "bank_transfer",
    Cheque: "cheque",
    Other: "other",
  };

  const method = paymentMethods[paymentMode];

  if (!method) {
    throw new Error(`Invalid payment mode: ${paymentMode}`);
  }

  return method;
};

const getCustomerDeliveryIncomeCategory = async () => {
  const category = await FinanceCategory.findOne({
    name: "customerDelivery",
    type: "income",
  });

  if (!category) {
    throw new Error(
      'Finance income category "customerDelivery" not found.'
    );
  }

  return category;
};

const validateOrderPayments = (payments = []) => {
  if (!Array.isArray(payments)) {
    throw new Error("Payment history must be an array.");
  }

  for (const payment of payments) {
    const amount = Number(payment.paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    if (!payment.paymentDate) {
      throw new Error("Payment date is required.");
    }

    if (!payment.paymentMode) {
      throw new Error("Payment mode is required.");
    }

    getFinancePaymentMethod(payment.paymentMode);
  }
};

const updateOrderPaymentSummary = (order) => {
  const paidAmount = order.paymentHistory.reduce(
    (total, payment) =>
      total + Number(payment.paymentAmount || 0),
    0
  );

  order.alreadyPaidAmount = paidAmount;

  order.pendingAmount = Math.max(
    Number(order.totalAmount || 0) - paidAmount,
    0
  );

  order.paymentStatus =
    paidAmount <= 0
      ? "Not Received"
      : paidAmount >= Number(order.totalAmount || 0)
        ? "Fully Received"
        : "Partially Received";
};

// One Payment History entry maps to one Finance Income transaction.
// Same payment ID updates the existing transaction.
// New payment ID creates a new transaction.

const syncOrderPaymentToFinance = async ({
  order,
  payment,
  categoryId,
  userId,
}) => {
  // Bulk Payment has its own single Finance Transaction.
  // Never create an individual Finance entry for a bulk allocation.
  if (payment.paymentSource === "bulk") {
    return null;
  }

  if (!payment._id) {
    throw new Error(
      "Payment History entry is missing its ID. Preserve the payment _id when editing an existing payment."
    );
  }

  return createTransaction(
    {
      entryMode: "automatic",
      type: "income",
      categoryId,
      amount: Number(payment.paymentAmount),
      transactionDate: new Date(),
      paymentMethod: getFinancePaymentMethod(payment.paymentMode),
      paymentReference: payment.referenceNumber || "",
      referenceNumber: order.orderNo,
      description: `Order ${order.orderNo} - Customer Payment`,

      sourceModule: SOURCE_MODULE,
      sourceId: order._id,
      sourcePaymentId: payment._id,
      sourceType: SOURCE_TYPE,
    },
    userId || null,
    {
      sourceModule: SOURCE_MODULE,
    }
  );
};

// =========================
// CREATE ORDER
// =========================

const createOrder = async (data, userId = null) => {
  const {
    source,
    enquiryId,
    enquiryNo,

    customerName,
    phone,
    platform,
    companyId,
    customerLocation,
    originalRequirement,
    additionalDetails,

    deliveryAddress,
    assignedLocation,

    startDate,
    endDate,

    products,

    // =========================
    // AMOUNT VALUES
    // =========================

    subTotal,
    taxPercentage,
    taxAmount,
    totalAmount,

    remarks,

    // =========================
    // PAYMENT VALUES
    // =========================

    alreadyPaidAmount,
    pendingAmount,
    paymentStatus,

    // =========================
    // PAYMENT HISTORY
    // =========================

    paymentHistory,

    // =========================
    // DELIVERY
    // =========================

    deliveryStatus,
  } = data;

  // =========================
  // VALIDATE PRODUCTS
  // =========================

  if (
    !Array.isArray(products) ||
    products.length === 0
  ) {
    throw new Error(
      "At least one product is required"
    );
  }

  // =========================
  // GENERATE ORDER NUMBER
  // =========================

  const orderNo =
    await generateOrderNo();

  // =========================
  // VALIDATE INITIAL PAYMENTS
  // =========================

  // Payments entered while creating an Order are Individual Payments.
  // Bulk allocations are added only by the Bulk Payment service.
  const initialPayments = (paymentHistory || []).map((payment) => ({
    ...payment,
    paymentSource: "individual",
    bulkPaymentId: null,
  }));

  validateOrderPayments(initialPayments);

  if (
    Number(alreadyPaidAmount || 0) > 0 &&
    initialPayments.length === 0
  ) {
    throw new Error(
      "Initial payment details are required in paymentHistory."
    );
  }

  const customerPaymentCategory =
    initialPayments.length > 0
      ? await getCustomerDeliveryIncomeCategory()
      : null;

  // =========================
  // CREATE ORDER
  // =========================

  const order =
    await Order.create({
      orderNo,

      source,

      enquiryId:
        enquiryId || null,

      enquiryNo:
        enquiryNo || null,

      customerName,

      phone,

      platform,

      companyId,

      customerLocation,

      originalRequirement,

      additionalDetails:
        additionalDetails || "",

      deliveryAddress,

      assignedLocation,

      startDate,

      endDate,

      // =========================
      // PRODUCTS
      // =========================

      products:
        formatProducts(products),

      // =========================
      // REMARKS
      // =========================

      remarks:
        remarks || "",

      // =========================
      // PAYMENT
      // =========================

      alreadyPaidAmount:
        initialPayments.length > 0
          ? initialPayments.reduce(
              (total, payment) =>
                total + Number(payment.paymentAmount || 0),
              0
            )
          : alreadyPaidAmount ?? 0,

      pendingAmount:
        initialPayments.length > 0
          ? Math.max(
              Number(totalAmount || 0) -
                initialPayments.reduce(
                  (total, payment) =>
                    total + Number(payment.paymentAmount || 0),
                  0
                ),
              0
            )
          : pendingAmount ?? 0,

      paymentStatus:
        initialPayments.length > 0
          ? (
              initialPayments.reduce(
                (total, payment) =>
                  total + Number(payment.paymentAmount || 0),
                0
              ) >= Number(totalAmount || 0)
                ? "Fully Received"
                : "Partially Received"
            )
          : paymentStatus || "Not Received",

      // =========================
      // PAYMENT HISTORY
      // =========================

      paymentHistory:
        initialPayments,

      // =========================
      // DELIVERY
      // =========================

      deliveryStatus:
        deliveryStatus ||
        "Pending",

      // =========================
      // AMOUNTS
      // =========================

      subTotal:
        subTotal ?? 0,

      taxPercentage:
        taxPercentage ?? 0,

      taxAmount:
        taxAmount ?? 0,

      totalAmount:
        totalAmount ?? 0,
    });

  // =========================
  // CREATE CUSTOMER DELIVERY
  // =========================

  await createCustomerDeliveryFromOrder(
    order
  );

  // =========================
  // CREATE FINANCE INCOME
  // FOR INITIAL PAYMENTS
  // =========================

  if (customerPaymentCategory) {
    for (const payment of order.paymentHistory) {
      if (payment.paymentSource === "bulk") {
        continue;
      }

      await syncOrderPaymentToFinance({
        order,
        payment,
        categoryId: customerPaymentCategory._id,
        userId,
      });
    }
  }

  await order.populate("companyId", "companyName");
  await order.populate("assignedLocation", "name");

  return order;
};

// =========================
// GET ALL ORDERS
// =========================

const getAllOrders = async () => {
  const orders = await Order.find()
    .populate("companyId", "companyName")
    .populate("assignedLocation", "name")
    .sort({
      startDate: -1,
      createdAt: -1,
    });

  return orders;
};

// =========================
// GET ORDER BY ID
// =========================

const getOrderById = async (orderId) => {
  const order =
    await Order.findById(orderId)
      .populate("companyId", "companyName")
      .populate("assignedLocation", "name");

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  return order;
};

// =========================
// UPDATE ORDER
// =========================

const updateOrder = async (
  orderId,
  data,
  userId = null
) => {
  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  // Keep existing payment IDs to identify edits versus new payments.
  const oldPaymentIds = new Set(
    order.paymentHistory.map((payment) =>
      payment._id.toString()
    )
  );

  // =========================
  // BASIC DETAILS
  // =========================

  if (data.source !== undefined) {
    order.source =
      data.source;
  }

  if (data.enquiryId !== undefined) {
    order.enquiryId =
      data.enquiryId;
  }

  if (data.enquiryNo !== undefined) {
    order.enquiryNo =
      data.enquiryNo;
  }

  if (data.customerName !== undefined) {
    order.customerName =
      data.customerName;
  }

  if (data.phone !== undefined) {
    order.phone =
      data.phone;
  }

  if (data.platform !== undefined) {
    order.platform =
      data.platform;
  }

  if (data.companyId !== undefined) {
    order.companyId =
      data.companyId;
  }

  if (
    data.customerLocation !==
    undefined
  ) {
    order.customerLocation =
      data.customerLocation;
  }

  if (
    data.originalRequirement !==
    undefined
  ) {
    order.originalRequirement =
      data.originalRequirement;
  }

  if (
    data.additionalDetails !==
    undefined
  ) {
    order.additionalDetails =
      data.additionalDetails;
  }

  if (
    data.deliveryAddress !==
    undefined
  ) {
    order.deliveryAddress =
      data.deliveryAddress;
  }

  if (
    data.assignedLocation !==
    undefined
  ) {
    order.assignedLocation =
      data.assignedLocation;
  }

  if (data.startDate !== undefined) {
    order.startDate =
      data.startDate;
  }

  if (data.endDate !== undefined) {
    order.endDate =
      data.endDate;
  }

  // =========================
  // PRODUCTS
  // =========================

  if (data.products !== undefined) {
    if (
      !Array.isArray(
        data.products
      ) ||
      data.products.length === 0
    ) {
      throw new Error(
        "At least one product is required"
      );
    }

    order.products =
      formatProducts(
        data.products
      );
  }

  // =========================
  // AMOUNT DETAILS
  // STORE EXACTLY AS RECEIVED
  // NO CALCULATION
  // =========================

  if (
    data.subTotal !== undefined
  ) {
    order.subTotal =
      data.subTotal;
  }

  if (
    data.taxPercentage !==
    undefined
  ) {
    order.taxPercentage =
      data.taxPercentage;
  }

  if (
    data.taxAmount !== undefined
  ) {
    order.taxAmount =
      data.taxAmount;
  }

  if (
    data.totalAmount !==
    undefined
  ) {
    order.totalAmount =
      data.totalAmount;
  }

  // =========================
  // PAYMENT DETAILS
  // =========================

  if (
    data.alreadyPaidAmount !== undefined &&
    data.paymentHistory === undefined
  ) {
    order.alreadyPaidAmount =
      data.alreadyPaidAmount;
  }

  if (
    data.pendingAmount !== undefined &&
    data.paymentHistory === undefined
  ) {
    order.pendingAmount =
      data.pendingAmount;
  }

  if (
    data.paymentStatus !== undefined &&
    data.paymentHistory === undefined
  ) {
    order.paymentStatus =
      data.paymentStatus;
  }

  // =========================
  // PAYMENT HISTORY
  // =========================

  let customerPaymentCategory = null;

  if (data.paymentHistory !== undefined) {
    if (!Array.isArray(data.paymentHistory)) {
      throw new Error("Payment history must be an array.");
    }

    // Existing entries must keep their _id.
    // New entries may omit _id; Mongoose will generate an ID.
    const incomingExistingIds = new Set(
      data.paymentHistory
        .filter((payment) => payment._id)
        .map((payment) => payment._id.toString())
    );

    for (const oldPaymentId of oldPaymentIds) {
      if (!incomingExistingIds.has(oldPaymentId)) {
        throw new Error(
          "Payment History cannot remove an existing payment. Edit the payment instead."
        );
      }
    }

    // Preserve Bulk Payment allocations from the database.
    // The normal Order update API may edit Individual Payments only.
    const existingBulkPayments = new Map(
      order.paymentHistory
        .filter((payment) => payment.paymentSource === "bulk")
        .map((payment) => [payment._id.toString(), payment])
    );

    order.paymentHistory = data.paymentHistory.map((payment) => {
      const paymentId = payment._id?.toString();
      const existingBulkPayment = paymentId
        ? existingBulkPayments.get(paymentId)
        : null;

      // Keep the stored bulk allocation exactly as it is.
      if (existingBulkPayment) {
        return existingBulkPayment.toObject();
      }

      // Entries submitted through the normal Order API are Individual Payments.
      return {
        ...payment,
        paymentSource: "individual",
        bulkPaymentId: null,
      };
    });

    validateOrderPayments(order.paymentHistory);

    if (order.paymentHistory.length > 0) {
      customerPaymentCategory =
        await getCustomerDeliveryIncomeCategory();
    }

    // Payment History is the source of truth
    // whenever it is included in an update.
    updateOrderPaymentSummary(order);
  }

  // =========================
  // DELIVERY STATUS
  // =========================

  if (
    data.deliveryStatus !==
    undefined
  ) {
    order.deliveryStatus =
      data.deliveryStatus;
  }

  // =========================
  // REMARKS
  // =========================

  if (
    data.remarks !== undefined
  ) {
    order.remarks =
      data.remarks;
  }

  // =========================
  // SAVE ORDER
  // =========================

  await order.save();

  // =========================
  // SYNC FINANCE TRANSACTIONS
  // =========================

  if (
    data.paymentHistory !== undefined &&
    customerPaymentCategory
  ) {
    for (const payment of order.paymentHistory) {
      if (payment.paymentSource === "bulk") {
        continue;
      }

      await syncOrderPaymentToFinance({
        order,
        payment,
        categoryId: customerPaymentCategory._id,
        userId,
      });
    }
  }

  // =========================
  // SYNC CUSTOMER DELIVERY
  // =========================

  await updateCustomerDeliveryFromOrder(
    order
  );

  await order.populate("companyId", "companyName");
  await order.populate("assignedLocation", "name");

  return order;
};

// =========================
// DELETE ORDER
// =========================

const deleteOrder = async (
  orderId
) => {
  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new Error(
      "Order not found"
    );
  }

  // =========================
  // DELETE CUSTOMER DELIVERY
  // =========================

  await CustomerDelivery.deleteMany({
    orderId: order._id,
  });

  // =========================
  // DELETE ORDER
  // =========================

  await Order.findByIdAndDelete(
    orderId
  );

  return {
    id: order._id,

    orderNo:
      order.orderNo,

    message:
      "Order deleted successfully",
  };
};

// =========================
// EXPORTS
// =========================

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};