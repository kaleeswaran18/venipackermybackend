const Tax = require("./tax.model");

// =========================
// Get Current Tax Balance
// =========================

const getCurrentTaxBalance = async (
  excludeId = null,
  options = {}
) => {
  const { session } = options;
  const match = {};

  if (excludeId) {
    match._id = { $ne: excludeId };
  }

  const creditQuery = Tax.aggregate([
    {
      $match: {
        ...match,
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

  if (session) {
    creditQuery.session(session);
  }

  const creditResult = await creditQuery;

  const debitQuery = Tax.aggregate([
    {
      $match: {
        ...match,
        transactionType: "DEBIT",
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

  if (session) {
    debitQuery.session(session);
  }

  const debitResult = await debitQuery;

  const totalCredit =
    creditResult[0]?.totalCredit || 0;

  const totalUsedTax =
    debitResult[0]?.totalUsedTax || 0;

  return totalCredit - totalUsedTax;
};

// =========================
// Create Tax Transaction
// =========================

const createTax = async (data, options = {}) => {
  const { session } = options;
  let usedTax = 0;
  let externalAmount = 0;

  // =========================
  // CREDIT
  // Purchase Tax
  // =========================

  if (data.transactionType === "CREDIT") {
    usedTax = 0;
    externalAmount = 0;
  }

  // =========================
  // DEBIT
  // Delivery Tax
  // =========================

  if (data.transactionType === "DEBIT") {
    const currentTaxBalance =
      await getCurrentTaxBalance(null, { session });

    usedTax = Math.min(
      currentTaxBalance,
      data.taxAmount
    );

    externalAmount =
      data.taxAmount - usedTax;
  }

  const taxData = {
    ...data,
    usedTax,
    externalAmount,
  };

  const tax = session
    ? (await Tax.create([taxData], { session }))[0]
    : await Tax.create(taxData);

  return tax;
};

// =========================
// Get All Tax Transactions
// =========================

const getTaxTransactions = async () => {
  const transactions =
    await Tax.find()
      .sort({
        transactionDate: -1,
        createdAt: -1,
      });

  return transactions;
};

// =========================
// Get Tax Transaction By ID
// =========================

const getTaxTransactionById = async (id) => {
  const tax =
    await Tax.findById(id);

  if (!tax) {
    throw new Error(
      "Tax transaction not found"
    );
  }

  return tax;
};

// =========================
// Get Tax Summary
// =========================

const getTaxSummary = async () => {
  const totalCreditResult =
    await Tax.aggregate([
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

  const totalUsedTaxResult =
    await Tax.aggregate([
      {
        $match: {
          transactionType: "DEBIT",
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

  const totalExternalAmountResult =
    await Tax.aggregate([
      {
        $match: {
          transactionType: "DEBIT",
        },
      },
      {
        $group: {
          _id: null,
          totalExternalAmount: {
            $sum: "$externalAmount",
          },
        },
      },
    ]);

  const totalCredit =
    totalCreditResult[0]?.totalCredit || 0;

  const totalUsedTax =
    totalUsedTaxResult[0]?.totalUsedTax || 0;

  const totalExternalAmount =
    totalExternalAmountResult[0]
      ?.totalExternalAmount || 0;

  const currentTaxBalance =
    totalCredit - totalUsedTax;

  return {
    totalCredit,
    totalUsedTax,
    totalExternalAmount,
    currentTaxBalance,
  };
};

// =========================
// Update Tax Transaction
// =========================

const updateTax = async (id, data, options = {}) => {
  const { session } = options;
  const taxQuery = Tax.findById(id);

  if (session) {
    taxQuery.session(session);
  }

  const tax = await taxQuery;

  if (!tax) {
    throw new Error(
      "Tax transaction not found"
    );
  }

  const transactionType =
    data.transactionType ||
    tax.transactionType;

  const taxAmount =
    data.taxAmount !== undefined
      ? data.taxAmount
      : tax.taxAmount;

  let usedTax = 0;
  let externalAmount = 0;

  // =========================
  // CREDIT
  // =========================

  if (transactionType === "CREDIT") {
    usedTax = 0;
    externalAmount = 0;
  }

  // =========================
  // DEBIT
  // =========================

  if (transactionType === "DEBIT") {
    const currentTaxBalance =
      await getCurrentTaxBalance(id, { session });

    usedTax = Math.min(
      currentTaxBalance,
      taxAmount
    );

    externalAmount =
      taxAmount - usedTax;
  }

  Object.assign(tax, data);

  tax.usedTax = usedTax;
  tax.externalAmount = externalAmount;

  if (session) {
    await tax.save({ session });
  } else {
    await tax.save();
  }

  return tax;
};

// =========================
// Delete Tax Transaction
// =========================

const deleteTax = async (id, options = {}) => {
  const { session } = options;
  const taxQuery = Tax.findById(id);

  if (session) {
    taxQuery.session(session);
  }

  const tax = await taxQuery;

  if (!tax) {
    throw new Error(
      "Tax transaction not found"
    );
  }

  // =========================
  // Prevent Invalid Balance
  // =========================

  if (
    tax.transactionType === "CREDIT"
  ) {
    const balanceAfterDelete =
      await getCurrentTaxBalance(id, { session });

    if (balanceAfterDelete < 0) {
      throw new Error(
        "Cannot delete this tax credit because it is already used by delivery transactions"
      );
    }
  }

  const deleteQuery = Tax.findByIdAndDelete(id);

  if (session) {
    deleteQuery.session(session);
  }

  await deleteQuery;

  return {
    message:
      "Tax transaction deleted successfully",
  };
};

module.exports = {
  createTax,
  getTaxTransactions,
  getTaxTransactionById,
  getTaxSummary,
  updateTax,
  deleteTax,
  getCurrentTaxBalance,
};
