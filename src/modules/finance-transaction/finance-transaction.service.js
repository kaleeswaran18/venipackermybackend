
const FinanceTransaction = require("./finance-transaction.model");
const FinanceCategory = require("../finance-category/finance-category.model");

// Common Transaction Fields
const transactionFields = [
  "type",
  "categoryId",
  "locationId",
  "amount",
  "transactionDate",
  "paymentMethod",
  "paymentReference",
  "description",
  "referenceNumber",
];

// 1. Validate Finance Category
const validateCategory = async (
  categoryId,
  type,
  session = null
) => {
  let query = FinanceCategory.findById(categoryId);

  if (session) {
    query = query.session(session);
  }

  const category = await query;

  if (!category) {
    throw new Error("Finance category not found");
  }

  if (category.type !== type) {
    throw new Error("Category type does not match transaction type");
  }

  return category;
};

// 2. Build Automatic Source Query
const getSourceQuery = (data) => {
  if (!data.sourceModule || !data.sourceId || !data.sourceType) {
    throw new Error("Automatic transaction source details are required");
  }

  return {
    sourceModule: data.sourceModule,
    sourceId: data.sourceId,
    sourcePaymentId: data.sourcePaymentId || null,
    sourceType: data.sourceType,
    isDeleted: false,
  };
};

// 3. Prepare Transaction Data
const prepareTransactionData = (data) => {
  const transactionData = {};

  transactionFields.forEach((field) => {
    if (data[field] !== undefined) {
      transactionData[field] = data[field];
    }
  });

  return transactionData;
};

// 4. Common Update Logic
const applyTransactionUpdate = async (
  transaction,
  data,
  userId,
  session = null
) => {
  const newType = data.type || transaction.type;
  const newCategoryId = data.categoryId || transaction.categoryId;

  if (data.type !== undefined || data.categoryId !== undefined) {
    await validateCategory(
      newCategoryId,
      newType,
      session
    );
  }

  // Amount History - Only when amount changes
  if (data.amount !== undefined) {
    const newAmount = Number(data.amount);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    if (newAmount !== transaction.amount) {
      transaction.amountHistory.push({
        oldAmount: transaction.amount,
        newAmount,
        updatedBy: userId,
        updatedAt: new Date(),
      });

      transaction.amount = newAmount;
    }
  }

  // Update Common Fields
  transactionFields.forEach((field) => {
    if (field !== "amount" && data[field] !== undefined) {
      transaction[field] = data[field];
    }
  });

  transaction.updatedBy = userId;

  await transaction.save(
    session ? { session } : {}
  );

  return transaction;
};

// 5. Create Transaction - Manual / Automatic
const createTransaction = async (
  data,
  userId,
  options = {}
) => {
  const { session = null } = options;

  console.log(
    "Creating transaction with data:",
    data,
    "and options:",
    options
  );

  const isAutomatic = data.entryMode === "automatic";

  // Automatic creation is allowed only from internal source modules
  if (isAutomatic && !options.sourceModule) {
    throw new Error(
      "Automatic transactions must be created from their source module"
    );
  }

  if (!isAutomatic && data.entryMode !== "manual") {
    throw new Error("Invalid transaction entry mode");
  }

  if (
    isAutomatic &&
    options.sourceModule !== data.sourceModule
  ) {
    throw new Error("Invalid automatic transaction source");
  }

  await validateCategory(
    data.categoryId,
    data.type,
    session
  );

  // Automatic: Find existing transaction to avoid duplicates
  if (isAutomatic) {
    const sourceQuery = getSourceQuery(data);

    let query = FinanceTransaction.findOne(sourceQuery);

    if (session) {
      query = query.session(session);
    }

    const existingTransaction = await query;

    if (existingTransaction) {
      return applyTransactionUpdate(
        existingTransaction,
        data,
        userId,
        session
      );
    }
  }

  const transactionData = prepareTransactionData(data);

  const [transaction] = await FinanceTransaction.create(
    [
      {
        ...transactionData,

        entryMode: data.entryMode,

        sourceModule: isAutomatic ? data.sourceModule : null,
        sourceId: isAutomatic ? data.sourceId : null,
        sourcePaymentId: isAutomatic
          ? data.sourcePaymentId || null
          : null,
        sourceType: isAutomatic ? data.sourceType : null,

        createdBy: userId,
      },
    ],
    session ? { session } : {}
  );

  return transaction;
};

// 6. Update Transaction - Manual / Automatic
const updateTransaction = async (
  transactionIdentifier,
  data,
  userId,
  options = {}
) => {
  const { session = null } = options;

  let transaction;

  // Automatic Update - Find using Source Reference
  if (options.sourceModule) {
    const sourceQuery = getSourceQuery({
      ...transactionIdentifier,
      sourceModule: options.sourceModule,
    });

    let query = FinanceTransaction.findOne(sourceQuery);

    if (session) {
      query = query.session(session);
    }

    transaction = await query;

    if (!transaction) {
      throw new Error("Automatic finance transaction not found");
    }

    if (transaction.entryMode !== "automatic") {
      throw new Error("Invalid automatic transaction");
    }

    if (transaction.sourceModule !== options.sourceModule) {
      throw new Error("Source module mismatch");
    }
  } else {
    // Manual Update
    if (
      data.entryMode !== undefined ||
      data.sourceModule !== undefined ||
      data.sourceId !== undefined ||
      data.sourcePaymentId !== undefined ||
      data.sourceType !== undefined
    ) {
      throw new Error("Source fields cannot be updated directly");
    }

    let query = FinanceTransaction.findOne({
      _id: transactionIdentifier,
      entryMode: "manual",
      isDeleted: false,
    });

    if (session) {
      query = query.session(session);
    }

    transaction = await query;

    if (!transaction) {
      throw new Error("Manual finance transaction not found");
    }
  }

  return applyTransactionUpdate(
    transaction,
    data,
    userId,
    session
  );
};

// 7. Get All Transactions - Month / Year / Location / Type / Entry Mode
const getAllTransactions = async (filters = {}) => {
  const query = {
    isDeleted: false,
  };

  // -----------------------------------------
  // TYPE FILTER
  // -----------------------------------------

  if (filters.type && filters.type !== "all") {
    if (!["income", "expense"].includes(filters.type)) {
      throw new Error("Invalid transaction type");
    }

    query.type = filters.type;
  }

  // -----------------------------------------
  // ENTRY MODE FILTER
  // -----------------------------------------

  if (filters.entryMode && filters.entryMode !== "all") {
    if (!["manual", "automatic"].includes(filters.entryMode)) {
      throw new Error("Invalid entry mode");
    }

    query.entryMode = filters.entryMode;
  }

  // -----------------------------------------
  // CATEGORY FILTER
  // -----------------------------------------

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  // -----------------------------------------
  // LOCATION FILTER
  // -----------------------------------------

  if (
    filters.locationId &&
    filters.locationId !== "all"
  ) {
    query.locationId = filters.locationId;
  }

  // -----------------------------------------
  // SOURCE MODULE FILTER
  // -----------------------------------------

  if (filters.sourceModule) {
    query.sourceModule = filters.sourceModule;
  }

  // -----------------------------------------
  // MONTH AND YEAR FILTER
  // Month value: January = 0, February = 1 ... December = 11
  // India timezone: UTC +05:30
  // -----------------------------------------

  const hasMonth = filters.month !== undefined && filters.month !== "";
  const hasYear = filters.year !== undefined && filters.year !== "";

  if (hasMonth || hasYear) {
    if (!hasMonth || !hasYear) {
      throw new Error("Both month and year are required");
    }

    const month = Number(filters.month);
    const year = Number(filters.year);

    if (
      !Number.isInteger(month) ||
      month < 0 ||
      month > 11
    ) {
      throw new Error("Invalid month. Month must be between 0 and 11");
    }

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new Error("Invalid year");
    }

    const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const monthStart = new Date(
      Date.UTC(year, month, 1) - INDIA_OFFSET_MS
    );

    const nextMonthStart = new Date(
      Date.UTC(year, month + 1, 1) - INDIA_OFFSET_MS
    );

    query.transactionDate = {
      $gte: monthStart,
      $lt: nextMonthStart,
    };
  }

  // -----------------------------------------
  // CUSTOM DATE FILTER
  // -----------------------------------------

  if (filters.startDate || filters.endDate) {
    query.transactionDate = query.transactionDate || {};

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);

      if (Number.isNaN(startDate.getTime())) {
        throw new Error("Invalid start date");
      }

      if (
        !query.transactionDate.$gte ||
        startDate > query.transactionDate.$gte
      ) {
        query.transactionDate.$gte = startDate;
      }
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);

      if (Number.isNaN(endDate.getTime())) {
        throw new Error("Invalid end date");
      }

      if (
        !query.transactionDate.$lt ||
        endDate >= query.transactionDate.$lt
      ) {
        delete query.transactionDate.$lt;
        query.transactionDate.$lte = endDate;
      } else {
        query.transactionDate.$lt = endDate;
      }
    }
  }

  // -----------------------------------------
  // FETCH TRANSACTIONS
  // -----------------------------------------

  return FinanceTransaction.find(query)
    .populate("categoryId", "name type")
    .populate("locationId")
    .populate("createdBy", "name")
    .populate("updatedBy", "name")
    .sort({ transactionDate: -1 });
};

// 8. Get Transaction By ID
const getTransactionById = async (transactionId) => {
  const transaction = await FinanceTransaction.findOne({
    _id: transactionId,
    isDeleted: false,
  })
    .populate("categoryId", "name type")
    .populate("locationId")
    .populate("createdBy", "name")
    .populate("updatedBy", "name")
    .populate("deletedBy", "name");

  if (!transaction) {
    throw new Error("Finance transaction not found");
  }

  return transaction;
};

// 9. Delete Manual Transaction - Soft Delete
const deleteTransaction = async (
  transactionId,
  userId
) => {
  const transaction = await FinanceTransaction.findOne({
    _id: transactionId,
    entryMode: "manual",
    isDeleted: false,
  });

  if (!transaction) {
    throw new Error("Manual finance transaction not found");
  }

  transaction.isDeleted = true;
  transaction.deletedAt = new Date();
  transaction.deletedBy = userId;

  await transaction.save();

  return transaction;
};

module.exports = {
  createTransaction,
  updateTransaction,
  getAllTransactions,
  getTransactionById,
  deleteTransaction,
};
