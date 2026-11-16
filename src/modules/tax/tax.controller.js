const {
  createTax,
  getTaxTransactions,
  getTaxTransactionById,
  getTaxSummary,
  updateTax,
  deleteTax,
} = require("./tax.service");

// =========================
// Create Tax
// =========================

const createTaxController = async (
  req,
  res,
  next
) => {
  try {
    const tax = await createTax(
      req.body
    );

    res.status(201).json({
      success: true,
      message:
        "Tax transaction created successfully",
      data: tax,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Get All Tax Transactions
// =========================

const getTaxTransactionsController = async (
  req,
  res,
  next
) => {
  try {
    const transactions =
      await getTaxTransactions();

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Get Tax Summary
// =========================

const getTaxSummaryController = async (
  req,
  res,
  next
) => {
  try {
    const summary =
      await getTaxSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Get Tax Transaction By ID
// =========================

const getTaxTransactionByIdController =
  async (req, res, next) => {
    try {
      const tax =
        await getTaxTransactionById(
          req.params.id
        );

      res.status(200).json({
        success: true,
        data: tax,
      });
    } catch (error) {
      next(error);
    }
  };

// =========================
// Update Tax
// =========================

const updateTaxController = async (
  req,
  res,
  next
) => {
  try {
    const tax =
      await updateTax(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Tax transaction updated successfully",
      data: tax,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// Delete Tax
// =========================

const deleteTaxController = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await deleteTax(
        req.params.id
      );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTaxController,
  getTaxTransactionsController,
  getTaxSummaryController,
  getTaxTransactionByIdController,
  updateTaxController,
  deleteTaxController,
};