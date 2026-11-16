const {
  createStockTransaction,
  getStockTransactions,
  getStockTransactionById,
  updateStockTransaction,
  deleteStockTransaction,
} = require("./StockTransaction.service");


// =========================
// Create Stock Transaction
// =========================

const createStockTransactionController = async (req, res, next) => {
  try {
    const transaction = await createStockTransaction(req.body);

    res.status(201).json({
      success: true,
      message: "Stock transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// Get All Stock Transactions
// =========================

const getStockTransactionsController = async (req, res, next) => {
  try {
    const transactions = await getStockTransactions();

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// Get Stock Transaction By ID
// =========================

const getStockTransactionByIdController = async (
  req,
  res,
  next
) => {
  try {
    const transaction =
      await getStockTransactionById(req.params.id);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// Update Stock Transaction
// =========================

const updateStockTransactionController = async (
  req,
  res,
  next
) => {
  try {
    const transaction =
      await updateStockTransaction(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Stock transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// Delete Stock Transaction
// =========================

const deleteStockTransactionController = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await deleteStockTransaction(req.params.id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createStockTransactionController,
  getStockTransactionsController,
  getStockTransactionByIdController,
  updateStockTransactionController,
  deleteStockTransactionController,
};