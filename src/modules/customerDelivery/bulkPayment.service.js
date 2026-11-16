
const mongoose = require("mongoose");

const Order = require("../order/order.model");
const BulkPayment = require("./bulkPayment.model");

const FinanceCategory = require(
  "../finance-category/finance-category.model"
);

const FinanceTransaction = require(
  "../finance-transaction/finance-transaction.model"
);

const SOURCE_MODULE = "bulkorderpayment";
const SOURCE_TYPE = "bulkorderpayment";

const PAYMENT_MODES = {
  Cash: "cash",
  UPI: "upi",
  "Bank Transfer": "bank_transfer",
  Cheque: "cheque",
  Other: "other",
};

// ==========================================
// COMMON HELPERS
// ==========================================

const roundAmount = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const validateObjectId = (id, name = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${name}`);
  }
};

const validatePaymentData = (data) => {
  if (!data || typeof data !== "object") {
    throw new Error("Payment data is required");
  }

  validateObjectId(data.companyId, "company ID");

  const receivedAmount = Number(data.receivedAmount);

  if (
    !Number.isFinite(receivedAmount) ||
    receivedAmount <= 0
  ) {
    throw new Error(
      "Received amount must be greater than zero"
    );
  }

  if (
    !data.paymentDate ||
    Number.isNaN(new Date(data.paymentDate).getTime())
  ) {
    throw new Error("Valid payment date is required");
  }

  if (!PAYMENT_MODES[data.paymentMode]) {
    throw new Error("Invalid payment mode");
  }

  return {
    companyId: data.companyId,
    receivedAmount: roundAmount(receivedAmount),
    paymentDate: new Date(data.paymentDate),
    paymentMode: data.paymentMode,
    referenceNumber: String(
      data.referenceNumber || ""
    ).trim(),
    remarks: String(data.remarks || "").trim(),
  };
};

const getIncomeCategory = async () => {
  const category = await FinanceCategory.findOne({
    name: "customerDelivery",
    type: "income",
  });

  if (!category) {
    throw new Error(
      'Finance income category "customerDelivery" not found'
    );
  }

  return category;
};

// ==========================================
// ORDER PAYMENT SUMMARY
// ==========================================

const recalculateOrderPayment = (order) => {
  const totalAmount = roundAmount(order.totalAmount);

  const paidAmount = roundAmount(
    order.paymentHistory.reduce(
      (sum, payment) =>
        sum + Number(payment.paymentAmount || 0),
      0
    )
  );

  if (paidAmount > totalAmount + 0.001) {
    throw new Error(
      `Payment exceeds total amount for order ${order.orderNo}`
    );
  }

  order.alreadyPaidAmount = paidAmount;

  order.pendingAmount = roundAmount(
    Math.max(totalAmount - paidAmount, 0)
  );

  order.paymentStatus =
    paidAmount <= 0
      ? "Not Received"
      : order.pendingAmount <= 0
        ? "Fully Received"
        : "Partially Received";
};

// ==========================================
// GET COMPANY PENDING ORDERS
// ==========================================

const getPendingOrdersByCompany = async (companyId) => {
  validateObjectId(companyId, "company ID");

  const orders = await Order.find({
    companyId,
  }).sort({
    createdAt: 1,
    _id: 1,
  });

  const pendingOrders = orders
    .map((order) => {
      const paidAmount = roundAmount(
        order.paymentHistory.reduce(
          (sum, payment) =>
            sum + Number(payment.paymentAmount || 0),
          0
        )
      );

      const pendingAmount = roundAmount(
        Math.max(Number(order.totalAmount) - paidAmount, 0)
      );

      return {
        orderId: order._id,
        orderNo: order.orderNo,
        orderDate: order.createdAt,
        totalAmount: roundAmount(order.totalAmount),
        alreadyPaidAmount: paidAmount,
        pendingAmount,
      };
    })
    .filter((order) => order.pendingAmount > 0);

  return {
    companyId,
    totalOutstandingAmount: roundAmount(
      pendingOrders.reduce(
        (sum, order) => sum + order.pendingAmount,
        0
      )
    ),
    pendingOrderCount: pendingOrders.length,
    pendingOrders,
  };
};

// ==========================================
// FIFO ALLOCATION
// ==========================================

const allocatePaymentFIFO = (
  orders,
  receivedAmount
) => {
  let remainingAmount = roundAmount(receivedAmount);

  const allocations = [];

  for (const order of orders) {
    if (remainingAmount <= 0) {
      break;
    }

    recalculateOrderPayment(order);

    const pendingAmount = roundAmount(
      order.pendingAmount
    );

    if (pendingAmount <= 0) {
      continue;
    }

    const allocatedAmount = roundAmount(
      Math.min(pendingAmount, remainingAmount)
    );

    if (allocatedAmount <= 0) {
      continue;
    }

    allocations.push({
      orderId: order._id,
      orderNo: order.orderNo,
      allocatedAmount,
    });

    remainingAmount = roundAmount(
      remainingAmount - allocatedAmount
    );
  }

  return {
    allocations,
    unallocatedAmount: Math.max(remainingAmount, 0),
  };
};

// ==========================================
// APPLY BULK ALLOCATIONS TO ORDERS
// ==========================================

const applyAllocationsToOrders = async ({
  orders,
  allocations,
  bulkPayment,
}) => {
  const orderMap = new Map(
    orders.map((order) => [
      order._id.toString(),
      order,
    ])
  );

  for (const allocation of allocations) {
    const order = orderMap.get(
      allocation.orderId.toString()
    );

    if (!order) {
      throw new Error(
        `Order not found: ${allocation.orderNo}`
      );
    }

    order.paymentHistory.push({
      paymentDate: bulkPayment.paymentDate,
      paymentAmount: allocation.allocatedAmount,
      paymentMode: bulkPayment.paymentMode,
      referenceNumber: bulkPayment.referenceNumber,
      remarks: bulkPayment.remarks,
      paymentSource: "bulk",
      bulkPaymentId: bulkPayment._id,
    });

    recalculateOrderPayment(order);

    await order.save();
  }
};

// ==========================================
// REVERSE ONLY THIS BULK PAYMENT
// ==========================================

const reverseBulkAllocations = async ({
  companyId,
  bulkPaymentId,
}) => {
  const orders = await Order.find({
    companyId,
    "paymentHistory.bulkPaymentId": bulkPaymentId,
  });

  for (const order of orders) {
    order.paymentHistory =
      order.paymentHistory.filter((payment) => {
        return !(
          payment.paymentSource === "bulk" &&
          payment.bulkPaymentId?.toString() ===
            bulkPaymentId.toString()
        );
      });

    recalculateOrderPayment(order);

    await order.save();
  }
};

// ==========================================
// SYNC SINGLE FINANCE INCOME TRANSACTION
// ==========================================

const syncBulkFinanceTransaction = async ({
  bulkPayment,
  userId,
}) => {
  const category = await getIncomeCategory();

  const sourceQuery = {
    entryMode: "automatic",
    sourceModule: SOURCE_MODULE,
    sourceId: bulkPayment._id,
    sourcePaymentId: null,
    sourceType: SOURCE_TYPE,
    isDeleted: false,
  };

  let transaction = await FinanceTransaction.findOne(
    sourceQuery
  );

  if (!transaction) {
    transaction = new FinanceTransaction({
      entryMode: "automatic",
      type: "income",
      categoryId: category._id,
      amount: bulkPayment.receivedAmount,
      transactionDate: bulkPayment.paymentDate,
      paymentMethod: PAYMENT_MODES[bulkPayment.paymentMode],
      paymentReference: bulkPayment.referenceNumber,
      referenceNumber: bulkPayment._id.toString(),
      description: `Bulk Payment - Company ${bulkPayment.companyId}`,
      sourceModule: SOURCE_MODULE,
      sourceId: bulkPayment._id,
      sourcePaymentId: null,
      sourceType: SOURCE_TYPE,
      createdBy: userId || null,
    });
  } else {
    const oldAmount = roundAmount(transaction.amount);
    const newAmount = roundAmount(bulkPayment.receivedAmount);

    if (oldAmount !== newAmount) {
      transaction.amountHistory.push({
        oldAmount,
        newAmount,
        updatedBy: userId || null,
        updatedAt: new Date(),
      });
    }

    transaction.amount = newAmount;
    transaction.categoryId = category._id;
    transaction.transactionDate = bulkPayment.paymentDate;
    transaction.paymentMethod = PAYMENT_MODES[bulkPayment.paymentMode];
    transaction.paymentReference = bulkPayment.referenceNumber;
    transaction.description =
      `Bulk Payment - Company ${bulkPayment.companyId}`;
    transaction.updatedBy = userId || null;
  }

  await transaction.save();

  bulkPayment.financeTransactionId = transaction._id;

  await bulkPayment.save();

  return transaction;
};

// ==========================================
// CREATE BULK PAYMENT
// ==========================================

const createBulkPayment = async (data, userId = null) => {
  const paymentData = validatePaymentData(data);

  // MongoDB standalone mode - no transaction session.
  const orders = await Order.find({
    companyId: paymentData.companyId,
  }).sort({ createdAt: 1, _id: 1 });

  const { allocations, unallocatedAmount } =
    allocatePaymentFIFO(orders, paymentData.receivedAmount);

  const bulkPayment = new BulkPayment({
    ...paymentData,
    allocations,
    unallocatedAmount,
    createdBy: userId,
    updatedBy: userId,

    allocationHistory: [
      {
        action: "created",
        oldAmount: 0,
        newAmount: paymentData.receivedAmount,
        oldAllocations: [],
        newAllocations: allocations,
        changedBy: userId,
        changedAt: new Date(),
      },
    ],
  });

  await bulkPayment.save();

  await applyAllocationsToOrders({
    orders,
    allocations,
    bulkPayment,
  });

  await syncBulkFinanceTransaction({
    bulkPayment,
    userId,
  });

  return await BulkPayment.findById(bulkPayment._id)
    .populate("companyId", "companyName")
    .populate("financeTransactionId");
};

// ==========================================
// UPDATE BULK PAYMENT
// ==========================================

const updateBulkPayment = async (
  bulkPaymentId,
  data,
  userId = null
) => {
  validateObjectId(bulkPaymentId, "bulk payment ID");

  const bulkPayment = await BulkPayment.findById(bulkPaymentId);

  if (!bulkPayment) {
    throw new Error("Bulk Payment not found");
  }

  if (
    data.companyId &&
    data.companyId.toString() !== bulkPayment.companyId.toString()
  ) {
    throw new Error("Bulk Payment company cannot be changed");
  }

  const paymentData = validatePaymentData({
    companyId: bulkPayment.companyId,
    receivedAmount: data.receivedAmount ?? bulkPayment.receivedAmount,
    paymentDate: data.paymentDate ?? bulkPayment.paymentDate,
    paymentMode: data.paymentMode ?? bulkPayment.paymentMode,
    referenceNumber: data.referenceNumber ?? bulkPayment.referenceNumber,
    remarks: data.remarks ?? bulkPayment.remarks,
  });

  // Store old payment details before changing.
  const oldAmount = bulkPayment.receivedAmount;

  const oldAllocations = (bulkPayment.allocations || []).map(
    (allocation) => ({
      orderId: allocation.orderId,
      orderNo: allocation.orderNo,
      allocatedAmount: allocation.allocatedAmount,
    })
  );

  // Remove only this Bulk Payment's old order entries.
  await reverseBulkAllocations({
    companyId: bulkPayment.companyId,
    bulkPaymentId: bulkPayment._id,
  });

  // Fetch orders again after reversing old payment.
  const orders = await Order.find({
    companyId: bulkPayment.companyId,
  }).sort({ createdAt: 1, _id: 1 });

  // Recalculate FIFO allocation.
  const { allocations, unallocatedAmount } =
    allocatePaymentFIFO(orders, paymentData.receivedAmount);

  // Update current payment.
  bulkPayment.receivedAmount = paymentData.receivedAmount;
  bulkPayment.paymentDate = paymentData.paymentDate;
  bulkPayment.paymentMode = paymentData.paymentMode;
  bulkPayment.referenceNumber = paymentData.referenceNumber;
  bulkPayment.remarks = paymentData.remarks;
  bulkPayment.allocations = allocations;
  bulkPayment.unallocatedAmount = unallocatedAmount;
  bulkPayment.updatedBy = userId;

  // Keep history for older documents too.
  if (!Array.isArray(bulkPayment.allocationHistory)) {
    bulkPayment.allocationHistory = [];
  }

  // Save old and new amount + allocations.
  bulkPayment.allocationHistory.push({
    action: "updated",
    oldAmount,
    newAmount: paymentData.receivedAmount,
    oldAllocations,
    newAllocations: allocations,
    changedBy: userId,
    changedAt: new Date(),
  });

  await bulkPayment.save();

  // Apply new FIFO allocation.
  await applyAllocationsToOrders({
    orders,
    allocations,
    bulkPayment,
  });

  // Update the SAME Finance Transaction.
  await syncBulkFinanceTransaction({
    bulkPayment,
    userId,
  });

  return await BulkPayment.findById(bulkPayment._id)
    .populate("companyId", "companyName")
    .populate("financeTransactionId");
};

// ==========================================
// GET BULK PAYMENT BY ID
// ==========================================

const getBulkPaymentById = async (bulkPaymentId) => {
  validateObjectId(bulkPaymentId, "bulk payment ID");

  const bulkPayment =
    await BulkPayment.findById(bulkPaymentId)
      .populate("companyId", "companyName")
      .populate(
        "allocations.orderId",
        "orderNo totalAmount pendingAmount"
      )
      .populate("financeTransactionId");

  if (!bulkPayment) {
    throw new Error("Bulk Payment not found");
  }

  return bulkPayment;
};

// ==========================================
// GET ALL BULK PAYMENTS
// ==========================================

const getAllBulkPayments = async (filters = {}) => {
  const query = {};

  if (filters.companyId) {
    validateObjectId(filters.companyId, "company ID");
    query.companyId = filters.companyId;
  }

  return BulkPayment.find(query)
    .populate("companyId", "companyName")
    .sort({
      paymentDate: -1,
      createdAt: -1,
    });
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getPendingOrders: getPendingOrdersByCompany,
  getPendingOrdersByCompany,
  createBulkPayment,
  updateBulkPayment,
  getBulkPaymentById,
  getAllBulkPayments,
};
