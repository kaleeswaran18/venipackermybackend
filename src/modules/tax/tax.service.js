const Tax = require("./tax.model");

// =========================
// Get Current Tax Balance
// =========================

const getCurrentTaxBalance = async (excludeId = null) => {
  const match = {};

  if (excludeId) {
    match._id = { $ne: excludeId };
  }

  const creditResult = await Tax.aggregate([
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

  const debitResult = await Tax.aggregate([
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

  const totalCredit =
    creditResult[0]?.totalCredit || 0;

  const totalUsedTax =
    debitResult[0]?.totalUsedTax || 0;

  return totalCredit - totalUsedTax;
};

// =========================
// Create Tax Transaction
// =========================

const createTax = async (data) => {
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
      await getCurrentTaxBalance();

    usedTax = Math.min(
      currentTaxBalance,
      data.taxAmount
    );

    externalAmount =
      data.taxAmount - usedTax;
  }

  const tax = await Tax.create({
    ...data,
    usedTax,
    externalAmount,
  });

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

const updateTax = async (id, data) => {
  const tax =
    await Tax.findById(id);

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
      await getCurrentTaxBalance(id);

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

  await tax.save();

  return tax;
};

// =========================
// Delete Tax Transaction
// =========================

const deleteTax = async (id) => {
  const tax =
    await Tax.findById(id);

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
      await getCurrentTaxBalance(id);

    if (balanceAfterDelete < 0) {
      throw new Error(
        "Cannot delete this tax credit because it is already used by delivery transactions"
      );
    }
  }

  await Tax.findByIdAndDelete(id);

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