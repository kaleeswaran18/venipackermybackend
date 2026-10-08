const consumableService = require("./consumable.service");

// CREATE CONSUMABLE
const createConsumable = async (req, res, next) => {
  try {
    const consumable =
      await consumableService.createConsumable(req.body);

    res.status(201).json({
      success: true,
      message: "Consumable created successfully",
      data: consumable,
    });
  } catch (error) {
    next(error);
  }
};


// GET ALL CONSUMABLES
const getAllConsumables = async (req, res, next) => {
  try {
    const consumables =
      await consumableService.getAllConsumables();

    res.status(200).json({
      success: true,
      data: consumables,
    });
  } catch (error) {
    next(error);
  }
};


// GET CONSUMABLE BY ID
const getConsumableById = async (req, res, next) => {
  try {
    const consumable =
      await consumableService.getConsumableById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      data: consumable,
    });
  } catch (error) {
    next(error);
  }
};


// UPDATE CONSUMABLE
const updateConsumable = async (req, res, next) => {
  try {
    const consumable =
      await consumableService.updateConsumable(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Consumable updated successfully",
      data: consumable,
    });
  } catch (error) {
    next(error);
  }
};


// DELETE CONSUMABLE
const deleteConsumable = async (req, res, next) => {
  try {
    const result =
      await consumableService.deleteConsumable(
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
  createConsumable,
  getAllConsumables,
  getConsumableById,
  updateConsumable,
  deleteConsumable,
};