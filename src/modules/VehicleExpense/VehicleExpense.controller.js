const {
  createVehicleExpense,
  getAllVehicleExpenses,
  getVehicleExpenseById,
  updateVehicleExpense,
  deleteVehicleExpense,
} = require("./VehicleExpense.service");

// CREATE
const create = async (req, res, next) => {
  try {
    const vehicleExpense =
      await createVehicleExpense(
        req.body,
        req.user.userId
      );

    return res.status(201).json({
      success: true,
      message:
        "Vehicle expense created successfully.",
      data: vehicleExpense,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL
const getAll = async (req, res, next) => {
  try {
    const vehicleExpenses =
      await getAllVehicleExpenses();

    return res.status(200).json({
      success: true,
      data: vehicleExpenses,
    });
  } catch (error) {
    next(error);
  }
};

// GET BY ID
const getById = async (
  req,
  res,
  next
) => {
  try {
    const vehicleExpense =
      await getVehicleExpenseById(
        req.params.id
      );

    if (!vehicleExpense) {
      return res.status(404).json({
        success: false,
        message:
          "Vehicle expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: vehicleExpense,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE
const update = async (
  req,
  res,
  next
) => {
  try {
    const vehicleExpense =
      await updateVehicleExpense(
        req.params.id,
        req.body,
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Vehicle expense updated successfully.",
      data: vehicleExpense,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE
const remove = async (
  req,
  res,
  next
) => {
  try {
    await deleteVehicleExpense(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Vehicle expense deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
};