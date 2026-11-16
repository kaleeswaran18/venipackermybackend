const pieceSizeService = require("./piece-size.service");

const createPieceSize = async (req, res, next) => {
  try {
    const pieceSize =
      await pieceSizeService.createPieceSize(req.body);

    res.status(201).json({
      success: true,
      message: "Piece size created successfully",
      data: pieceSize,
    });
  } catch (error) {
    next(error);
  }
};

const getPieceSizes = async (req, res, next) => {
  try {
    const pieceSizes =
      await pieceSizeService.getPieceSizes();

    res.status(200).json({
      success: true,
      data: pieceSizes,
    });
  } catch (error) {
    next(error);
  }
};

const getPieceSizeById = async (req, res, next) => {
  try {
    const pieceSize =
      await pieceSizeService.getPieceSizeById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: pieceSize,
    });
  } catch (error) {
    next(error);
  }
};

const updatePieceSize = async (req, res, next) => {
  try {
    const pieceSize =
      await pieceSizeService.updatePieceSize(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Piece size updated successfully",
      data: pieceSize,
    });
  } catch (error) {
    next(error);
  }
};

const deletePieceSize = async (req, res, next) => {
  try {
    const result =
      await pieceSizeService.deletePieceSize(
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
  createPieceSize,
  getPieceSizes,
  getPieceSizeById,
  updatePieceSize,
  deletePieceSize,
};