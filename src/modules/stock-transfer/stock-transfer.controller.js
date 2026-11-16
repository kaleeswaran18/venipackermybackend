
const stockTransferService = require("./stock-transfer.service");

// CREATE STOCK TRANSFER
const createStockTransfer = async (req, res, next) => {
  try {
    console.log("Authenticated User:", req.user);
console.log("Authenticated User ID:", req.user?._id);
    const transfer = await stockTransferService.createStockTransfer(
      req.body,
      req.user.userId
    );

    return res.status(201).json({
      success: true,
      message: "Stock transfer completed successfully",
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL STOCK TRANSFERS
const getAllStockTransfers = async (req, res, next) => {
  try {
    const transfers =
      await stockTransferService.getAllStockTransfers(req.query);

    return res.status(200).json({
      success: true,
      message: "Stock transfers fetched successfully",
      count: transfers.length,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

// GET TRANSFERS BY LOCATION
const getStockTransfersByLocation = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    const transfers =
      await stockTransferService.getStockTransfersByLocation(
        locationId,
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Location stock transfers fetched successfully",
      count: transfers.length,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE STOCK TRANSFER
const updateStockTransfer = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.updateStockTransfer(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Stock transfer updated successfully",
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStockTransfer,
  getAllStockTransfers,
  getStockTransfersByLocation,
  updateStockTransfer,
};
