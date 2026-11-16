const {
  createOverallStock,
  getAllOverallStocks,
  getOverallStockById,
  updateOverallStock,
  deleteOverallStock,
} = require("./finished-material-product-stock.service");

const createOverallStockController = async (
  req,
  res,
  next
) => {
  try {
    const stock = await createOverallStock(req.body);

    res.status(201).json({
      success: true,
      message: "Overall stock created successfully",
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOverallStocksController = async (
  req,
  res,
  next
) => {
  try {
    const {
      productId,
      locationId,
      categoryId,
    } = req.query;

    const stocks = await getAllOverallStocks(
      productId,
      locationId,
      categoryId
    );

    res.status(200).json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    next(error);
  }
};

const getOverallStockByIdController = async (
  req,
  res,
  next
) => {
  try {
    const stock = await getOverallStockById(
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

const updateOverallStockController = async (
  req,
  res,
  next
) => {
  try {
    const stock = await updateOverallStock(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Overall stock updated successfully",
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

const deleteOverallStockController = async (
  req,
  res,
  next
) => {
  try {
    await deleteOverallStock(req.params.id);

    res.status(200).json({
      success: true,
      message: "Overall stock deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOverallStockController,
  getAllOverallStocksController,
  getOverallStockByIdController,
  updateOverallStockController,
  deleteOverallStockController,
};