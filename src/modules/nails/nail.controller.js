const nailService = require("./nail.service");

// =========================
// CREATE NAIL
// =========================

const createNail = async (req, res, next) => {
  try {
    const nail = await nailService.createNail(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Nail created successfully",
      data: nail,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ALL NAILS
// =========================

const getAllNails = async (req, res, next) => {
  try {
    const nails = await nailService.getAllNails();

    res.status(200).json({
      success: true,
      message: "Nails fetched successfully",
      data: nails,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET NAIL BY ID
// =========================

const getNailById = async (req, res, next) => {
  try {
    const nail = await nailService.getNailById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Nail fetched successfully",
      data: nail,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// UPDATE NAIL
// =========================

const updateNail = async (req, res, next) => {
  try {
    const nail = await nailService.updateNail(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Nail updated successfully",
      data: nail,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// DELETE NAIL
// =========================

const deleteNail = async (req, res, next) => {
  try {
    const result = await nailService.deleteNail(
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
  createNail,
  getAllNails,
  getNailById,
  updateNail,
  deleteNail,
};