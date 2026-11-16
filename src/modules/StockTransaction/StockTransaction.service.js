const StockTransaction = require("./StockTransaction.model");


// =========================
// Create Stock Transaction
// =========================

const createStockTransaction = async (data) => {
  const transaction = await StockTransaction.create(data);

  return transaction;
};


// =========================
// Get All Stock Transactions
// =========================

const getStockTransactions = async () => {
  const transactions = await StockTransaction.find()
    .populate("location")
    .populate("category")
    .sort({
      transactionDate: -1,
      createdAt: -1,
    });

  return transactions;
};


// =========================
// Get Stock Transaction By ID
// =========================

const getStockTransactionById = async (id) => {
  const transaction = await StockTransaction.findById(id)
    .populate("location")
    .populate("category");

  if (!transaction) {
    throw new Error("Stock transaction not found");
  }

  return transaction;
};


// =========================
// Update Stock Transaction
// =========================

const updateStockTransaction = async (id, data) => {
  const transaction = await StockTransaction.findById(id);

  if (!transaction) {
    throw new Error("Stock transaction not found");
  }

  Object.assign(transaction, data);

  await transaction.save();

  return transaction;
};


// =========================
// Delete Stock Transaction
// =========================

const deleteStockTransaction = async (id) => {
  const transaction = await StockTransaction.findById(id);

  if (!transaction) {
    throw new Error("Stock transaction not found");
  }

  await StockTransaction.findByIdAndDelete(id);

  return {
    message: "Stock transaction deleted successfully",
  };
};


module.exports = {
  createStockTransaction,
  getStockTransactions,
  getStockTransactionById,
  updateStockTransaction,
  deleteStockTransaction,
};