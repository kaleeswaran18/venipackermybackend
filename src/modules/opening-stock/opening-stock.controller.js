const openingStockService = require("./opening-stock.service");

/*
 * ==========================================
 * CREATE OPENING STOCK
 * ==========================================
 */

const createOpeningStock = async (req, res, next) => {
  try {
    const openingStock =
      await openingStockService.createOpeningStock(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Opening stock created successfully",
      data: openingStock,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * ==========================================
 * GET ALL OPENING STOCKS
 * ==========================================
 */

const getOpeningStocks = async (req, res, next) => {
  try {
    const { locationId } = req.query;

    const openingStocks =
      await openingStockService.getOpeningStocks(
        locationId
      );

    res.status(200).json({
      success: true,
      data: openingStocks,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * ==========================================
 * GET OPENING STOCK BY ID
 * ==========================================
 */

const getOpeningStockById = async (req, res, next) => {
  try {
    const openingStock =
      await openingStockService.getOpeningStockById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: openingStock,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * ==========================================
 * UPDATE OPENING STOCK
 * Main fields
 * ==========================================
 */

const updateOpeningStock = async (req, res, next) => {
  try {
    const openingStock =
      await openingStockService.updateOpeningStock(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Opening stock updated successfully",
      data: openingStock,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * ==========================================
 * UPDATE PARTICULAR PIECE
 * ==========================================
 */

const updateOpeningStockPiece = async (
  req,
  res,
  next
) => {
  try {
    const openingStock =
      await openingStockService.updateOpeningStockPiece(
        req.params.openingStockId,
        req.params.pieceId,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Piece updated successfully",
      data: openingStock,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * ==========================================
 * DELETE OPENING STOCK
 * ==========================================
 */

const deleteOpeningStock = async (req, res, next) => {
  try {
    const result =
      await openingStockService.deleteOpeningStock(
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

/*
 * ==========================================
 * DELETE PARTICULAR PIECE
 * ==========================================
 */

const deleteOpeningStockPiece = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await openingStockService.deleteOpeningStockPiece(
        req.params.openingStockId,
        req.params.pieceId
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
  createOpeningStock,
  getOpeningStocks,
  getOpeningStockById,

  updateOpeningStock,
  updateOpeningStockPiece,

  deleteOpeningStock,
  deleteOpeningStockPiece,
};