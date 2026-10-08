const FinishedMaterialStock = require(
  "./finishedMaterialStock.model"
);


// CREATE FINISHED MATERIAL STOCK
const createFinishedMaterialStock = async ({
  finishedMaterialId,
  locationId,
  quantity,
  date,
}) => {
  const stock = await FinishedMaterialStock.create({
    finishedMaterialId,
    locationId,
    quantity,
    date,
  });

  return stock;
};


// GET ALL FINISHED MATERIAL STOCK
const getAllFinishedMaterialStocks = async () => {
  const stocks = await FinishedMaterialStock.find()
    .populate("finishedMaterialId", "name")
    .populate("locationId", "name")
    .sort({ date: -1 });

  return stocks;
};


// GET FINISHED MATERIAL STOCK BY ID
const getFinishedMaterialStockById = async (
  stockId
) => {
  const stock = await FinishedMaterialStock.findById(
    stockId
  )
    .populate("finishedMaterialId", "name")
    .populate("locationId", "name");

  if (!stock) {
    throw new Error(
      "Finished material stock not found"
    );
  }

  return stock;
};


// UPDATE FINISHED MATERIAL STOCK
const updateFinishedMaterialStock = async (
  stockId,
  {
    finishedMaterialId,
    locationId,
    quantity,
    date,
    isActive,
  }
) => {
  const stock =
    await FinishedMaterialStock.findById(stockId);

  if (!stock) {
    throw new Error(
      "Finished material stock not found"
    );
  }

  if (finishedMaterialId !== undefined) {
    stock.finishedMaterialId =
      finishedMaterialId;
  }

  if (locationId !== undefined) {
    stock.locationId = locationId;
  }

  if (quantity !== undefined) {
    stock.quantity = quantity;
  }

  if (date !== undefined) {
    stock.date = date;
  }

  if (isActive !== undefined) {
    stock.isActive = isActive;
  }

  await stock.save();

  return stock;
};


// DELETE FINISHED MATERIAL STOCK
const deleteFinishedMaterialStock = async (
  stockId
) => {
  const stock =
    await FinishedMaterialStock.findById(stockId);

  if (!stock) {
    throw new Error(
      "Finished material stock not found"
    );
  }

  await FinishedMaterialStock.findByIdAndDelete(
    stockId
  );

  return {
    id: stock._id,
    message:
      "Finished material stock deleted successfully",
  };
};


module.exports = {
  createFinishedMaterialStock,
  getAllFinishedMaterialStocks,
  getFinishedMaterialStockById,
  updateFinishedMaterialStock,
  deleteFinishedMaterialStock,
};