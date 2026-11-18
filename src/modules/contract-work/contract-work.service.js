const mongoose = require("mongoose");
const ContractWork = require("./contract-work.model");
const FinanceCategory = require("../finance-category/finance-category.model");
const FinanceTransaction = require("../finance-transaction/finance-transaction.model");

const {
  createTransaction,
  updateTransaction,
} = require("../finance-transaction/finance-transaction.service");

const SOURCE_MODULE = "contract-work";
const CATEGORY_NAME = "ContractWork";

// Convert Contract Work payment mode to Finance payment method
const getPaymentMethod = (mode) => {
  const methods = {
    Cash: "cash",
    UPI: "upi",
    "Bank Transfer": "bank_transfer",
    Cheque: "cheque",
  };

  const paymentMethod = methods[mode];

  if (!paymentMethod) {
    throw new Error("Invalid Contract Work payment mode");
  }

  return paymentMethod;
};

// Find ContractWork Expense Category
const getContractWorkCategory = async (session = null) => {
  let query = FinanceCategory.findOne({
    name: CATEGORY_NAME,
    type: "expense",
  });

  if (session) {
    query = query.session(session);
  }

  const category = await query;

  if (!category) {
    throw new Error("ContractWork expense category not found.");
  }

  return category;
};

// Build Finance Transaction Data
const buildFinanceTransactionData = (
  contractWork,
  payment,
  category
) => ({
  entryMode: "automatic",
  type: "expense",
  categoryId: category._id,
  locationId: contractWork.location,
  amount: payment.amount,
  transactionDate: payment.paymentDate,
  paymentMethod: getPaymentMethod(payment.paymentMode),
  description: `${contractWork.contractorName} - ${payment.paymentType === "advance" ? "Advance" : "Contract Work Payment"} - ${contractWork.workDescription}`,
  sourceModule: SOURCE_MODULE,
  sourceId: contractWork._id,
  sourcePaymentId: payment._id,
  sourceType: payment.paymentType,
});

// Create or Update linked Finance Transaction
const syncPaymentFinance = async (
  contractWork,
  payment,
  userId,
  session = null
) => {
  if (Number(payment.amount) <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const category = await getContractWorkCategory(session);

  const transactionData = buildFinanceTransactionData(
    contractWork,
    payment,
    category
  );

  // Find existing Finance Transaction for this payment
  let existingTransactionQuery = FinanceTransaction.findOne({
    sourceModule: SOURCE_MODULE,
    sourceId: contractWork._id,
    sourcePaymentId: payment._id,
    sourceType: payment.paymentType,
    isDeleted: false,
  });

  if (session) {
    existingTransactionQuery =
      existingTransactionQuery.session(session);
  }

  const existingTransaction = await existingTransactionQuery;

  if (existingTransaction) {
    // Update existing Finance Transaction
    const updatedTransaction = await updateTransaction(
      {
        sourceModule: SOURCE_MODULE,
        sourceId: contractWork._id,
        sourcePaymentId: payment._id,
        sourceType: payment.paymentType,
      },
      {
        categoryId: category._id,
        locationId: contractWork.location,
        amount: payment.amount,
        transactionDate: new Date(),
        paymentMethod: transactionData.paymentMethod,
        description: transactionData.description,
      },
      userId,
      {
        sourceModule: SOURCE_MODULE,
        session,
      }
    );

    payment.financeTransactionId = updatedTransaction._id;
  } else {
    // Create new Finance Transaction
    const newTransaction = await createTransaction(
      transactionData,
      userId,
      {
        sourceModule: SOURCE_MODULE,
        session,
      }
    );

    payment.financeTransactionId = newTransaction._id;
  }
};

// Create Contract Work
const createContractWork = async (data, userId) => {
  const session = await mongoose.startSession();

  try {
    let contractWork;

    await session.withTransaction(async () => {
      [contractWork] = await ContractWork.create(
        [data],
        { session }
      );

      // Sync initial Advance / Payment records
      if (contractWork.payments.length > 0) {
        for (const payment of contractWork.payments) {
          await syncPaymentFinance(
            contractWork,
            payment,
            userId,
            session
          );
        }

        await contractWork.save({ session });
      }
    });

    return contractWork;
  } finally {
    await session.endSession();
  }
};

// Get All Contract Works
const getAllContractWorks = async (filters = {}) => {
  const query = {};

  if (filters.location) {
    query.location = filters.location;
  }

  if (filters.contractorName) {
    query.contractorName = {
      $regex: filters.contractorName,
      $options: "i",
    };
  }

  if (filters.startDate || filters.endDate) {
    query.startingDate = {};

    if (filters.startDate) {
      query.startingDate.$gte = new Date(filters.startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      query.startingDate.$lte = endDate;
    }
  }

  return ContractWork.find(query)
    .populate("location", "name")
    .sort({ createdAt: -1 });
};

// Get Contract Work By ID
const getContractWorkById = async (id) => {
  return ContractWork.findById(id).populate("location", "name");
};

// Update Contract Work
const updateContractWork = async (id, data, userId) => {
  return ContractWork.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("location", "name");
};

// Delete Contract Work
const deleteContractWork = async (id) => {
  return ContractWork.findByIdAndDelete(id);
};

// Add Payment
const addPayment = async (contractWorkId, paymentData, userId) => {
  const session = await mongoose.startSession();

  try {
    let contractWork;

    await session.withTransaction(async () => {
      contractWork = await ContractWork.findById(
        contractWorkId
      ).session(session);

      if (!contractWork) {
        throw new Error("Contract Work not found");
      }

      // Add payment to Contract Work
      contractWork.payments.push(paymentData);

      const payment = contractWork.payments[
        contractWork.payments.length - 1
      ];

      // Create linked Finance Transaction
      await syncPaymentFinance(
        contractWork,
        payment,
        userId,
        session
      );

      await contractWork.save({ session });
    });

    return contractWork;
  } finally {
    await session.endSession();
  }
};

// Update Individual Payment
const updatePayment = async (
  contractWorkId,
  paymentId,
  paymentData,
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let contractWork;

    await session.withTransaction(async () => {
      contractWork = await ContractWork.findById(
        contractWorkId
      ).session(session);

      if (!contractWork) {
        throw new Error("Contract Work not found");
      }

      const payment = contractWork.payments.find(
        (item) => item.paymentId === paymentId
      );

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Update only editable payment fields
      const allowedFields = [
        "amount",
        "paymentDate",
        "paymentMode",
        "remarks",
      ];

      allowedFields.forEach((field) => {
        if (paymentData[field] !== undefined) {
          payment[field] = paymentData[field];
        }
      });

      // Update the same linked Finance Transaction
      await syncPaymentFinance(
        contractWork,
        payment,
        userId,
        session
      );

      await contractWork.save({ session });
    });

    return contractWork;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createContractWork,
  getAllContractWorks,
  getContractWorkById,
  updateContractWork,
  deleteContractWork,
  addPayment,
  updatePayment,
};
