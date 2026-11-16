
const financeTransactionService = require("./finance-transaction.service");

// 1. Create Transaction
const createTransaction = async (req, res, next) => {
  try {
    const transaction = await financeTransactionService.createTransaction(
      req.body,
      req.user._id
    );

    return res.status(201).json({
      success: true,
      message: "Finance transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Update Manual Transaction
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await financeTransactionService.updateTransaction(
      req.params.id,
      req.body,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Finance transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get All Transactions
const getAllTransactions = async (req, res, next) => {
  try {
    const transactions =
      await financeTransactionService.getAllTransactions(req.query);

    return res.status(200).json({
      success: true,
      message: "Finance transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Transaction By ID
const getTransactionById = async (req, res, next) => {
  try {
    const transaction =
      await financeTransactionService.getTransactionById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Finance transaction fetched successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Transaction (Soft Delete)
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await financeTransactionService.deleteTransaction(
      req.params.id,
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "Finance transaction deleted successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  updateTransaction,
  getAllTransactions,
  getTransactionById,
  deleteTransaction,
};
