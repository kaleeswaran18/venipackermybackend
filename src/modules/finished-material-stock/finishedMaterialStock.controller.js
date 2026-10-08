const finishedMaterialStockService = require(
  "./finishedMaterialStock.service"
);

// CREATE
const createFinishedMaterialStock = async (
  req,
  res,
  next
) => {
  try {
    const stock =
      await finishedMaterialStockService
        .createFinishedMaterialStock(req.body);

    res.status(201).json({
      success: true,
      message:
        "Finished material stock created successfully",
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};


// GET ALL
const getAllFinishedMaterialStocks = async (
  req,
  res,
  next
) => {
  try {
    const stocks =
      await finishedMaterialStockService
        .getAllFinishedMaterialStocks();

    res.status(200).json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    next(error);
  }
};


// GET BY ID
const getFinishedMaterialStockById = async (
  req,
  res,
  next
) => {
  try {
    const stock =
      await finishedMaterialStockService
        .getFinishedMaterialStockById(
          req.params.id
        );

    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};


// UPDATE
const updateFinishedMaterialStock = async (
  req,
  res,
  next
) => {
  try {
    const stock =
      await finishedMaterialStockService
        .updateFinishedMaterialStock(
          req.params.id,
          req.body
        );

    res.status(200).json({
      success: true,
      message:
        "Finished material stock updated successfully",
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};


// DELETE
const deleteFinishedMaterialStock = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await finishedMaterialStockService
        .deleteFinishedMaterialStock(
          req.params.id
        );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createFinishedMaterialStock,
  getAllFinishedMaterialStocks,
  getFinishedMaterialStockById,
  updateFinishedMaterialStock,
  deleteFinishedMaterialStock,
};