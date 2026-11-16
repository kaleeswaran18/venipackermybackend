const weeklySalaryService = require("./weekly-salary.service");

// Create weekly salary
const createWeeklySalary = async (req, res, next) => {
  try {
    const salary =
      await weeklySalaryService.createWeeklySalary(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Weekly salary created successfully",
      data: salary,
    });
  } catch (error) {
    next(error);
  }
};

// Get all weekly salaries
const getAllWeeklySalary = async (
  req,
  res,
  next
) => {
  try {
    const salaries =
      await weeklySalaryService.getAllWeeklySalary();

    res.status(200).json({
      success: true,
      message:
        "Weekly salaries fetched successfully",
      data: salaries,
    });
  } catch (error) {
    next(error);
  }
};

// Get weekly salary by ID
const getWeeklySalaryById = async (
  req,
  res,
  next
) => {
  try {
    const salary =
      await weeklySalaryService.getWeeklySalaryById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message:
        "Weekly salary fetched successfully",
      data: salary,
    });
  } catch (error) {
    next(error);
  }
};

// Update weekly salary
const updateWeeklySalary = async (
  req,
  res,
  next
) => {
  try {
    const salary =
      await weeklySalaryService.updateWeeklySalary(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Weekly salary updated successfully",
      data: salary,
    });
  } catch (error) {
    next(error);
  }
};

// Delete weekly salary
const deleteWeeklySalary = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await weeklySalaryService.deleteWeeklySalary(
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
  createWeeklySalary,
  getAllWeeklySalary,
  getWeeklySalaryById,
  updateWeeklySalary,
  deleteWeeklySalary,
};