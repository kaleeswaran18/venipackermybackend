const FinishedMaterialStock = require(
  "./finishedMaterialStock.model"
);


// CREATE FINISHED MATERIAL STOCK
const createFinishedMaterialStock = async ({
  name,
  categoryId,
}) => {
  const stock =
    await FinishedMaterialStock.create({
      name,
      categoryId,
    });

  return stock;
};


// GET ALL FINISHED MATERIAL STOCK
const getAllFinishedMaterialStocks = async () => {
  const stocks =
    await FinishedMaterialStock.find()
      .populate(
        "categoryId",
        "_id name"
      )
      .sort({
        createdAt: -1,
      });

  return stocks;
};


// GET FINISHED MATERIAL STOCK BY ID
const getFinishedMaterialStockById = async (
  stockId
) => {
  const stock =
    await FinishedMaterialStock.findById(
      stockId
    ).populate(
      "categoryId",
      "_id name"
    );

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
  { name, categoryId }
) => {
  const stock =
    await FinishedMaterialStock.findById(
      stockId
    );

  if (!stock) {
    throw new Error(
      "Finished material stock not found"
    );
  }

  if (name !== undefined) {
    stock.name = name;
  }

  if (categoryId !== undefined) {
    stock.categoryId = categoryId;
  }

  await stock.save();

  return stock;
};


// DELETE FINISHED MATERIAL STOCK
const deleteFinishedMaterialStock = async (
  stockId
) => {
  const stock =
    await FinishedMaterialStock.findById(
      stockId
    );

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