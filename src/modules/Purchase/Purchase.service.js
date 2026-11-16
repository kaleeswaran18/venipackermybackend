const Purchase = require("./Purchase.model");

const Location = require("../locations/location.model");

const OpeningStock = require(
  "../opening-stock/opening-stock.model"
);



const Tax = require("../tax/tax.model");

const Item = require("../items/item.model");

const ItemCategory = require(
  "../item-categories/item-category.model"
);

const Nail = require("../nails/nail.model");

const Consumable = require(
  "../consumables/consumable.model"
);
const FinanceCategory =require("../finance-category/finance-category.model");
const {
  createTransaction,
  updateTransaction,
} = require("../finance-transaction/finance-transaction.service");

// =========================
// Generate Purchase Number
// =========================



// =========================
// Validate Location
// =========================

const validateLocation = async (locationId) => {
  const location = await Location.findById(locationId);

  if (!location) {
    throw new Error("Location not found");
  }

  return location;
};

// =========================
// Validate Reference
// =========================

const validateReference = async ({
  type,
  category,
  referenceId,
}) => {
  if (type === "item") {
    const itemCategory = await ItemCategory.findById(category);

    if (!itemCategory) {
      throw new Error("Item category not found");
    }

    const item = await Item.findById(referenceId);

    if (!item) {
      throw new Error("Item not found");
    }

    return {
      category: itemCategory,
      reference: item,
    };
  }

  if (type === "nail") {
    const nail = await Nail.findById(referenceId);

    if (!nail) {
      throw new Error("Nail not found");
    }

    return {
      category: null,
      reference: nail,
    };
  }

  if (type === "consumable") {
    const consumable = await Consumable.findById(
      referenceId
    );

    if (!consumable) {
      throw new Error("Consumable not found");
    }

    return {
      category: null,
      reference: consumable,
    };
  }

  throw new Error("Invalid purchase type");
};
// =========================
// Get Opening Stock Snapshot
// =========================

const getOpeningStockSnapshot = (openingStock) => {
  return {
    quantity: openingStock.quantity ?? 0,
    currentStock: openingStock.currentStock ?? 0,
    unit: openingStock.unit ?? null,
    cft: openingStock.cft ?? 0,
    cubicMeter: openingStock.cubicMeter ?? 0,

    pieces: (openingStock.pieces || []).map((piece) => ({
      pieceSizeId: piece.pieceSizeId,
      width: piece.width,
      inch: piece.inch,
      feet: piece.feet,
      count: piece.count,
    })),
  };
};
// =========================
// Find Opening Stock
// =========================

const findOpeningStock = async ({
  location,
  type,
  category,
  referenceId,
}) => {
  const query = {
    location,
    type,
    referenceId,
  };

  if (type === "item") {
    query.category = category;
  }

  const openingStock =
    await OpeningStock.findOne(query);

  if (!openingStock) {
    throw new Error(
      "Matching opening stock not found"
    );
  }

  return openingStock;
};

// =========================
// Update Opening Stock
// =========================

const updateOpeningStock = async (
  openingStock,
  purchaseData,
  operation
) => {
  const multiplier =
    operation === "add" ? 1 : -1;

  // =========================
  // Quantity Based Stock
  // Used Item / Nail / Consumable
  // =========================

  if (
    purchaseData.quantity !== null &&
    purchaseData.quantity !== undefined
  ) {
    const quantityChange =
      purchaseData.quantity * multiplier;

    const currentStock =
      openingStock.currentStock || 0;

    const newStock =
      currentStock + quantityChange;

    if (newStock < 0) {
      throw new Error(
        "Insufficient opening stock"
      );
    }

    openingStock.currentStock = newStock;

    await openingStock.save();

    return;
  }

  // =========================
  // New Item Stock
  // =========================

  if (
    purchaseData.pieces &&
    purchaseData.pieces.length > 0
  ) {
    for (const purchasePiece of purchaseData.pieces) {
      const stockPiece =
        openingStock.pieces.find(
          (piece) =>
            piece.pieceSizeId.toString() ===
            purchasePiece.pieceSizeId.toString()
        );

      if (!stockPiece) {
        throw new Error(
          "Matching piece size not found in opening stock"
        );
      }

      const newCount =
        stockPiece.count +
        purchasePiece.count * multiplier;

      if (newCount < 0) {
        throw new Error(
          "Insufficient piece stock"
        );
      }

      stockPiece.count = newCount;
    }
  }

  if (
    purchaseData.cft !== null &&
    purchaseData.cft !== undefined
  ) {
    const currentCft =
      openingStock.cft || 0;

    const newCft =
      currentCft +
      purchaseData.cft * multiplier;

    if (newCft < 0) {
      throw new Error(
        "Insufficient CFT stock"
      );
    }

    openingStock.cft = newCft;
  }

  if (
    purchaseData.cubicMeter !== null &&
    purchaseData.cubicMeter !== undefined
  ) {
    const currentCubicMeter =
      openingStock.cubicMeter || 0;

    const newCubicMeter =
      currentCubicMeter +
      purchaseData.cubicMeter * multiplier;

    if (newCubicMeter < 0) {
      throw new Error(
        "Insufficient cubic meter stock"
      );
    }

    openingStock.cubicMeter =
      newCubicMeter;
  }

  await openingStock.save();
};

// =========================
// Create Stock Transaction
// =========================



// ======================================================
// TAX HELPERS
// ======================================================

// =========================
// Get Current Tax Balance
// =========================

const getCurrentTaxBalance = async () => {
  const creditResult = await Tax.aggregate([
    {
      $match: {
        transactionType: "CREDIT",
      },
    },
    {
      $group: {
        _id: null,
        totalCredit: {
          $sum: "$taxAmount",
        },
      },
    },
  ]);

  const debitResult = await Tax.aggregate([
    {
      $match: {
        transactionType: "DEBIT",
        sourceType: "Delivery",
      },
    },
    {
      $group: {
        _id: null,
        totalUsedTax: {
          $sum: "$usedTax",
        },
      },
    },
  ]);

  const totalCredit =
    creditResult[0]?.totalCredit || 0;

  const totalUsedTax =
    debitResult[0]?.totalUsedTax || 0;

  return totalCredit - totalUsedTax;
};

// =========================
// Create Purchase Tax
// =========================

const createPurchaseTax = async (purchase) => {
  const taxAmount =
    Number(purchase.taxAmount) || 0;

  // No tax
  if (taxAmount <= 0) {
    return null;
  }

  const tax = await Tax.create({
    transactionDate: purchase.purchaseDate,

    transactionType: "CREDIT",

    taxAmount,

    usedTax: 0,

    externalAmount: 0,

    sourceType: "Purchase",

    sourceId: purchase._id,

    remarks:
      `Purchase ${purchase.purchaseNo} tax credit`,
  });

  return tax;
};



// =========================
// Create Purchase
// =========================



const createPurchase = async (data, userId) => {
  // =========================
  // Validate location
  // =========================

  await validateLocation(data.location);

  // =========================
  // Validate item / nail / consumable
  // =========================

  await validateReference({
    type: data.type,
    category: data.category,
    referenceId: data.referenceId,
  });

  // =========================
  // Find Matching Opening Stock
  // =========================

  const openingStock = await findOpeningStock({
    location: data.location,
    type: data.type,
    category: data.category,
    referenceId: data.referenceId,
  });

  if (!openingStock) {
    throw new Error("Opening stock not found");
  }

  // =========================
  // Capture Old Stock
  // =========================

  const oldStock = getOpeningStockSnapshot(openingStock);

  // =========================
  // Calculate Payment Details
  // =========================

  const paidAmount = Number(data.paidAmount || 0);

  const totalAmount = Number(data.totalAmount);

  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    throw new Error("Invalid purchase total amount");
  }

  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    throw new Error("Invalid paid amount");
  }

  if (paidAmount > totalAmount) {
    throw new Error(
      "Paid amount cannot exceed total purchase amount"
    );
  }

  const pendingAmount = totalAmount - paidAmount;

  const paymentStatus =
    paidAmount === 0
      ? "Unpaid"
      : paidAmount === totalAmount
      ? "Paid"
      : "Partially Paid";

  // =========================
  // Create Payment History
  // =========================

  const paymentHistory =
    paidAmount > 0
      ? [
          {
            paymentDate: new Date(),
            amount: paidAmount,
            paymentMode: "Cash",
            remarks: "",
          },
        ]
      : [];

  // =========================
  // Finance Category
  // =========================

  let purchaseCategory = null;

  if (paidAmount > 0) {
    purchaseCategory = await FinanceCategory.findOne({
      name: "purchase",
      type: "expense",
    });

    if (!purchaseCategory) {
      throw new Error(
        "Purchase finance category not found"
      );
    }
  }

  // =========================
  // Initial Purchase Snapshot
  // =========================

  const initialSnapshot = {
    purchaseNo: data.purchaseNo,
    purchaseDate: data.purchaseDate,
    amount: Number(data.amount || 0),
    taxAmount: Number(data.taxAmount || 0),
    totalAmount: Number(data.totalAmount || 0),
  };

  // =========================
  // Create Purchase
  // =========================

  const purchase = await Purchase.create({
    ...data,

    purchaseNo: data.purchaseNo,

    openingStockId: openingStock._id,

    paymentHistory,

    paidAmount,
    pendingAmount,
    paymentStatus,

    initialSnapshot,
  });

  // =========================
  // Update Opening Stock
  // =========================

  await updateOpeningStock(
    openingStock,
    purchase,
    "add"
  );

  // =========================
  // Capture New Stock
  // =========================

  const newStock = getOpeningStockSnapshot(openingStock);

  // =========================
  // Save Opening Stock History
  // =========================

  openingStock.stockHistory.push({
    oldStock,

    newStock,

    changedQuantity: Number(
      purchase.quantity || purchase.cft || 0
    ),

    operation: "PURCHASE_IN",

    referenceId: purchase._id,

    changedBy: userId,

    changedAt: new Date(),
  });

  await openingStock.save();

  // =========================
  // Create Purchase Tax CREDIT
  // =========================

  await createPurchaseTax(purchase);

  // =========================
  // Create Finance Transactions
  // =========================

  if (paymentHistory.length > 0) {
    for (const payment of purchase.paymentHistory) {
      await createTransaction(
        {
          entryMode: "automatic",

          type: "expense",

          categoryId: purchaseCategory._id,

          locationId: purchase.location,

          amount: payment.amount,

          transactionDate: payment.paymentDate,

          paymentMethod: "cash",

          description: `Purchase ${purchase.purchaseNo}`,

          sourceModule: "purchase",

          sourceId: purchase._id,

          sourcePaymentId: payment._id,

          sourceType: "purchase",
        },
        userId,
        {
          sourceModule: "purchase",
        }
      );
    }
  }

  // =========================
  // Return Purchase
  // =========================

  return purchase;
};



// =========================
// Get All Purchases
// =========================

const getPurchases = async () => {
  const purchases =
    await Purchase.find()
      .populate("location")
      .populate("category")
      .populate("openingStockId")
      .sort({
        purchaseDate: -1,
        createdAt: -1,
      });

  return purchases;
};

// =========================
// Get Purchase By ID
// =========================

const getPurchaseById = async (id) => {
  const purchase =
    await Purchase.findById(id)
      .populate("location")
      .populate("category")
      .populate("openingStockId");

  if (!purchase) {
    throw new Error(
      "Purchase not found"
    );
  }

  return purchase;
};

// =========================
// Update Purchase
// =========================


const updatePurchase = async (id, data, userId) => {
  // =========================
  // 1. Find Existing Purchase
  // =========================

  const purchase = await Purchase.findById(id);

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  // =========================
  // Helper Functions
  // =========================

  const normalizeDateToMinute = (value) => {
    const timestamp = new Date(value).getTime();

    if (!Number.isFinite(timestamp)) {
      return null;
    }

    return Math.floor(timestamp / 60000);
  };

  const normalizeId = (value) =>
    value?._id?.toString() || value?.toString() || "";

  const normalizePieces = (pieces = []) =>
    pieces.map((piece) => ({
      pieceSizeId: normalizeId(piece.pieceSizeId),
      width: Number(piece.width || 0),
      inch: Number(piece.inch || 0),
      feet: Number(piece.feet || 0),
      count: Number(piece.count || 0),
    }));

  // =========================
  // 2. Store Old Purchase Data
  // =========================

  const oldPurchaseData = {
    location: purchase.location,
    type: purchase.type,
    category: purchase.category,
    referenceId: purchase.referenceId,
    quantity: purchase.quantity,
    unit: purchase.unit,
    cft: purchase.cft,
    cubicMeter: purchase.cubicMeter,
    pieces: purchase.pieces.map((piece) => ({
      pieceSizeId: piece.pieceSizeId,
      width: piece.width,
      inch: piece.inch,
      feet: piece.feet,
      count: piece.count,
    })),
  };

  const oldPurchaseSnapshot = {
    ...oldPurchaseData,
    purchaseNo: purchase.purchaseNo,
    purchaseDate: purchase.purchaseDate,
    supplierName: purchase.supplierName,
    supplierPhone: purchase.supplierPhone,
    supplierAddress: purchase.supplierAddress,
    amount: purchase.amount,
    taxAmount: purchase.taxAmount,
    totalAmount: purchase.totalAmount,
    paidAmount: purchase.paidAmount,
    pendingAmount: purchase.pendingAmount,
    paymentStatus: purchase.paymentStatus,
  };

  // =========================
  // 3. Prepare New Purchase Data
  // =========================

  const newPurchaseData = {
    location: data.location ?? purchase.location,
    type: data.type ?? purchase.type,

    category:
      data.category !== undefined
        ? data.category
        : purchase.category,

    referenceId: data.referenceId ?? purchase.referenceId,

    quantity: data.quantity ?? purchase.quantity,
    unit: data.unit ?? purchase.unit,

    cft: data.cft ?? purchase.cft,
    cubicMeter: data.cubicMeter ?? purchase.cubicMeter,

    pieces: data.pieces ?? purchase.pieces,
  };

  // =========================
  // 4. Validate New Data
  // =========================

  await validateLocation(newPurchaseData.location);

  await validateReference({
    type: newPurchaseData.type,
    category: newPurchaseData.category,
    referenceId: newPurchaseData.referenceId,
  });

  // =========================
  // 5. Find Old Opening Stock
  // =========================

  const oldOpeningStock = await OpeningStock.findById(
    purchase.openingStockId
  );

  if (!oldOpeningStock) {
    throw new Error("Old opening stock not found");
  }

  // =========================
  // 6. Find New Opening Stock
  // =========================

  let newOpeningStock = await findOpeningStock({
    location: newPurchaseData.location,
    type: newPurchaseData.type,
    category: newPurchaseData.category,
    referenceId: newPurchaseData.referenceId,
  });

  if (!newOpeningStock) {
    throw new Error("New opening stock not found");
  }

  const sameOpeningStock =
    oldOpeningStock._id.toString() ===
    newOpeningStock._id.toString();

  if (sameOpeningStock) {
    newOpeningStock = oldOpeningStock;
  }

  // =========================
  // 7. Calculate Amount Details
  // =========================

  const newAmount =
    data.amount !== undefined
      ? Number(data.amount)
      : purchase.amount;

  const newTaxAmount =
    data.taxAmount !== undefined
      ? Number(data.taxAmount)
      : purchase.taxAmount;

  const newTotalAmount =
    data.totalAmount !== undefined
      ? Number(data.totalAmount)
      : newAmount + newTaxAmount;

  if (
    !Number.isFinite(newAmount) ||
    !Number.isFinite(newTaxAmount) ||
    !Number.isFinite(newTotalAmount) ||
    newAmount < 0 ||
    newTaxAmount < 0 ||
    newTotalAmount < 0
  ) {
    throw new Error("Invalid purchase amount details");
  }

  // =========================
  // 8. Section-wise Change Detection
  // =========================

  // Purchase Details

  const oldPurchaseDate = new Date(purchase.purchaseDate);

  const updatedPurchaseDate = new Date(
    data.purchaseDate ?? purchase.purchaseDate
  );

  const purchaseDetailsChanged =
    purchase.purchaseNo !==
      (data.purchaseNo ?? purchase.purchaseNo) ||

    normalizeDateToMinute(oldPurchaseDate) !==
      normalizeDateToMinute(updatedPurchaseDate);


      const purchaseNoChanged =
  purchase.purchaseNo !==
  (data.purchaseNo ?? purchase.purchaseNo);
  // Stock Details

  const stockChanged =
    normalizeId(purchase.location) !==
      normalizeId(newPurchaseData.location) ||

    purchase.type !== newPurchaseData.type ||

    normalizeId(purchase.category) !==
      normalizeId(newPurchaseData.category) ||

    normalizeId(purchase.referenceId) !==
      normalizeId(newPurchaseData.referenceId) ||

    Number(purchase.quantity || 0) !==
      Number(newPurchaseData.quantity || 0) ||

    (purchase.unit || "") !==
      (newPurchaseData.unit || "") ||

    Number(purchase.cft || 0) !==
      Number(newPurchaseData.cft || 0) ||

    Number(purchase.cubicMeter || 0) !==
      Number(newPurchaseData.cubicMeter || 0) ||

    JSON.stringify(normalizePieces(purchase.pieces)) !==
      JSON.stringify(normalizePieces(newPurchaseData.pieces));

  // Supplier Details

  const supplierChanged =
    (purchase.supplierName || "") !==
      (data.supplierName ?? purchase.supplierName ?? "") ||

    (purchase.supplierPhone || "") !==
      (data.supplierPhone ?? purchase.supplierPhone ?? "") ||

    (purchase.supplierAddress || "") !==
      (data.supplierAddress ?? purchase.supplierAddress ?? "");

  // Amount Details

  const amountChanged =
    Number(purchase.amount || 0) !== newAmount ||

    Number(purchase.taxAmount || 0) !== newTaxAmount ||

    Number(purchase.totalAmount || 0) !== newTotalAmount;
console.log("PURCHASE HISTORY DEBUG", {
  oldPurchaseNo: purchase.purchaseNo,
  incomingPurchaseNo: data.purchaseNo,
  oldPurchaseDate: purchase.purchaseDate,
  incomingPurchaseDate: data.purchaseDate,
  purchaseDetailsChanged,
  supplierChanged,
  amountChanged,
});
  // Purchase Remarks

  const remarksChanged =
    (purchase.remarks || "") !==
      (data.remarks ?? purchase.remarks ?? "");

  // =========================
  // 9. Payment Mode Mapping
  // =========================

  const paymentModeMap = {
    Cash: "cash",
    UPI: "upi",
    "Bank Transfer": "bank_transfer",
    Cheque: "cheque",
  };

  // =========================
  // 10. Process Payment History
  // =========================

  const incomingPayments = Array.isArray(data.paymentHistory)
    ? data.paymentHistory
    : [];

  const newPayments = [];

  for (const incomingPayment of incomingPayments) {
    // -------------------------
    // Existing Payment
    // -------------------------

    if (incomingPayment._id) {
      const existingPayment = purchase.paymentHistory.id(
        incomingPayment._id
      );

      if (!existingPayment) {
        throw new Error(
          `Payment not found: ${incomingPayment._id}`
        );
      }

      const oldAmount = Number(existingPayment.amount);
      const oldPaymentDate = existingPayment.paymentDate;
      const oldPaymentMode = existingPayment.paymentMode;
      const oldRemarks = existingPayment.remarks || "";

      const updatedAmount =
        incomingPayment.amount !== undefined
          ? Number(incomingPayment.amount)
          : oldAmount;

      const updatedPaymentDate =
        incomingPayment.paymentDate ?? oldPaymentDate;

      const updatedPaymentMode =
        incomingPayment.paymentMode ?? oldPaymentMode;

      const updatedRemarks =
        incomingPayment.remarks ?? oldRemarks;

      if (
        !Number.isFinite(updatedAmount) ||
        updatedAmount <= 0
      ) {
        throw new Error("Invalid payment amount");
      }

      if (!paymentModeMap[updatedPaymentMode]) {
        throw new Error("Invalid payment mode");
      }

      // Actual Payment Change Detection

      const paymentChanged =
        oldAmount !== updatedAmount ||

        normalizeDateToMinute(oldPaymentDate) !==
          normalizeDateToMinute(updatedPaymentDate) ||

        oldPaymentMode !== updatedPaymentMode ||

        oldRemarks !== updatedRemarks;

      if (paymentChanged) {
        // Payment Edit History

        existingPayment.editHistory.push({
          oldAmount,
          newAmount: updatedAmount,

          oldPaymentDate,
          newPaymentDate: updatedPaymentDate,

          oldPaymentMode,
          newPaymentMode: updatedPaymentMode,

          oldRemarks,
          newRemarks: updatedRemarks,

          changedBy: userId,
          changedAt: new Date(),
        });

        // Update Existing Payment

        existingPayment.amount = updatedAmount;
        existingPayment.paymentDate = updatedPaymentDate;
        existingPayment.paymentMode = updatedPaymentMode;
        existingPayment.remarks = updatedRemarks;

        // Update Existing Finance Transaction

        await updateTransaction(
          {
            sourceModule: "purchase",
            sourceId: purchase._id,
            sourcePaymentId: existingPayment._id,
            sourceType: "purchase",
          },
          {
            amount: updatedAmount,
            transactionDate: updatedPaymentDate,
            paymentMethod: paymentModeMap[updatedPaymentMode],
            description: `Purchase ${purchase.purchaseNo}`,
          },
          userId,
          {
            sourceModule: "purchase",
          }
        );
      }
    } else {
      // -------------------------
      // New Payment
      // -------------------------

      const newPaymentAmount = Number(incomingPayment.amount);

      if (
        !Number.isFinite(newPaymentAmount) ||
        newPaymentAmount <= 0
      ) {
        throw new Error("Invalid new payment amount");
      }

      if (!paymentModeMap[incomingPayment.paymentMode]) {
        throw new Error("Invalid payment mode");
      }

      purchase.paymentHistory.push({
        paymentDate: incomingPayment.paymentDate,
        amount: newPaymentAmount,
        paymentMode: incomingPayment.paymentMode,
        remarks: incomingPayment.remarks || "",
      });

      newPayments.push(
        purchase.paymentHistory[
          purchase.paymentHistory.length - 1
        ]
      );
    }
  }

  // =========================
  // 11. Calculate Payment Summary
  // =========================

  const paidAmount = purchase.paymentHistory.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  if (paidAmount > newTotalAmount) {
    throw new Error(
      "Paid amount cannot exceed total purchase amount"
    );
  }

  const pendingAmount = newTotalAmount - paidAmount;

  const paymentStatus =
    paidAmount === 0
      ? "Unpaid"
      : paidAmount === newTotalAmount
      ? "Paid"
      : "Partially Paid";

  // =========================
  // 12. Finance Category
  // =========================

  let purchaseCategory = null;

  if (newPayments.length > 0) {
    purchaseCategory = await FinanceCategory.findOne({
      name: "purchase",
      type: "expense",
    });

    if (!purchaseCategory) {
      throw new Error("Purchase finance category not found");
    }
  }

  // =========================
  // 13-17. Stock Update
  // Only If Stock Changed
  // =========================

  if (stockChanged) {
    const oldStock = getOpeningStockSnapshot(oldOpeningStock);

    // Reverse Old Purchase Stock

    await updateOpeningStock(
      oldOpeningStock,
      oldPurchaseData,
      "remove"
    );

    const oldStockAfterReverse =
      getOpeningStockSnapshot(oldOpeningStock);

    // Capture New Stock Before Apply

    const newStockBeforeApply = sameOpeningStock
      ? oldStockAfterReverse
      : getOpeningStockSnapshot(newOpeningStock);

    // Apply Updated Purchase Stock

    await updateOpeningStock(
      newOpeningStock,
      newPurchaseData,
      "add"
    );

    const newStockAfterApply =
      getOpeningStockSnapshot(newOpeningStock);

    // Save Stock History

    if (sameOpeningStock) {
      newOpeningStock.stockHistory.push({
        oldStock,
        newStock: newStockAfterApply,

        changedQuantity: Number(
          newPurchaseData.quantity ||
          newPurchaseData.cft ||
          0
        ),

        operation: "PURCHASE_UPDATE",
        referenceId: purchase._id,
        changedBy: userId,
        changedAt: new Date(),
      });

      await newOpeningStock.save();
    } else {
      oldOpeningStock.stockHistory.push({
        oldStock,
        newStock: oldStockAfterReverse,

        changedQuantity: Number(
          oldPurchaseData.quantity ||
          oldPurchaseData.cft ||
          0
        ),

        operation: "PURCHASE_UPDATE",
        referenceId: purchase._id,
        changedBy: userId,
        changedAt: new Date(),
      });

      await oldOpeningStock.save();

      newOpeningStock.stockHistory.push({
        oldStock: newStockBeforeApply,
        newStock: newStockAfterApply,

        changedQuantity: Number(
          newPurchaseData.quantity ||
          newPurchaseData.cft ||
          0
        ),

        operation: "PURCHASE_UPDATE",
        referenceId: purchase._id,
        changedBy: userId,
        changedAt: new Date(),
      });

      await newOpeningStock.save();
    }
  }

  // =========================
  // 18. Update Existing Purchase
  // =========================

  // Do NOT spread ...data here.
  // It could overwrite paymentHistory and its editHistory.

  Object.assign(purchase, {
    ...newPurchaseData,

    purchaseNo: data.purchaseNo ?? purchase.purchaseNo,
    purchaseDate: data.purchaseDate ?? purchase.purchaseDate,

    supplierName: data.supplierName ?? purchase.supplierName,
    supplierPhone: data.supplierPhone ?? purchase.supplierPhone,
    supplierAddress: data.supplierAddress ?? purchase.supplierAddress,

    remarks: data.remarks ?? purchase.remarks,

    amount: newAmount,
    taxAmount: newTaxAmount,
    totalAmount: newTotalAmount,

    paidAmount,
    pendingAmount,
    paymentStatus,

    ...(stockChanged && {
      openingStockId: newOpeningStock._id,
    }),
  });

  // =========================
  // 19. Section-wise Purchase History
  // =========================

  // Purchase Details History

  if (purchaseDetailsChanged) {
    purchase.history.push({
      section: "purchase",

      oldData: {
        purchaseNo: oldPurchaseSnapshot.purchaseNo,
        purchaseDate: oldPurchaseSnapshot.purchaseDate,
      },

      newData: {
        purchaseNo: purchase.purchaseNo,
        purchaseDate: purchase.purchaseDate,
      },

      changedBy: userId,
      changedAt: new Date(),
    });
  }

  // Supplier History

  if (supplierChanged) {
    purchase.history.push({
      section: "supplier",

      oldData: {
        supplierName: oldPurchaseSnapshot.supplierName,
        supplierPhone: oldPurchaseSnapshot.supplierPhone,
        supplierAddress: oldPurchaseSnapshot.supplierAddress,
      },

      newData: {
        supplierName: purchase.supplierName,
        supplierPhone: purchase.supplierPhone,
        supplierAddress: purchase.supplierAddress,
      },

      changedBy: userId,
      changedAt: new Date(),
    });
  }

  // Amount History

  if (amountChanged) {
    purchase.history.push({
      section: "amount",

      oldData: {
        amount: oldPurchaseSnapshot.amount,
        taxAmount: oldPurchaseSnapshot.taxAmount,
        totalAmount: oldPurchaseSnapshot.totalAmount,
      },

      newData: {
        amount: newAmount,
        taxAmount: newTaxAmount,
        totalAmount: newTotalAmount,
      },

      changedBy: userId,
      changedAt: new Date(),
    });
  }

  // Remarks History

  if (remarksChanged) {
    purchase.history.push({
      section: "remarks",

      oldData: {
        remarks: oldPurchaseSnapshot.remarks || "",
      },

      newData: {
        remarks: purchase.remarks || "",
      },

      changedBy: userId,
      changedAt: new Date(),
    });
  }
  console.log(
  "HISTORY BEFORE SAVE",
  purchase.history.map((item) => ({
    section: item.section,
    oldData: item.oldData,
    newData: item.newData,
  }))
);
// =========================
// Update Finance Transaction Descriptions
// When Purchase No Changes
// =========================

if (purchaseNoChanged) {
  for (const payment of purchase.paymentHistory) {
    await updateTransaction(
      {
        sourceModule: "purchase",
        sourceId: purchase._id,
        sourcePaymentId: payment._id,
        sourceType: "purchase",
      },
      {
        description: `Purchase ${purchase.purchaseNo}`,
      },
      userId,
      {
        sourceModule: "purchase",
      }
    );
  }
}
  await purchase.save();

  // =========================
  // 20. Update Existing Purchase Tax
  // =========================

  const purchaseTax = await Tax.findOne({
    sourceType: "Purchase",
    sourceId: purchase._id,
    transactionType: "CREDIT",
  });

  if (purchaseTax) {
    if (newTaxAmount > 0) {
      purchaseTax.taxAmount = newTaxAmount;
      await purchaseTax.save();
    } else {
      await purchaseTax.deleteOne();
    }
  } else if (newTaxAmount > 0) {
    await createPurchaseTax(purchase);
  }

  // =========================
  // 21. Create Finance Transactions
  // Only New Payments
  // =========================

  for (const payment of newPayments) {
    await createTransaction(
      {
        entryMode: "automatic",
        type: "expense",
        categoryId: purchaseCategory._id,
        locationId: purchase.location,
        amount: payment.amount,
        transactionDate: payment.paymentDate,
        paymentMethod: paymentModeMap[payment.paymentMode],
        description: `Purchase ${purchase.purchaseNo}`,

        sourceModule: "purchase",
        sourceId: purchase._id,
        sourcePaymentId: payment._id,
        sourceType: "purchase",
      },
      userId,
      {
        sourceModule: "purchase",
      }
    );
  }

  // =========================
  // 22. Return Updated Purchase
  // =========================

  return purchase;
};








module.exports = {
 
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  // deletePurchase,
};