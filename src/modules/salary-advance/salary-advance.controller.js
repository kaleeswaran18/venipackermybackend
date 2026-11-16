const salaryAdvanceService = require(
  "./salary-advance.service"
);

// Create salary advance
const createSalaryAdvance = async (
  req,
  res,
  next
) => {
  try {
    const advance =
      await salaryAdvanceService.createSalaryAdvance(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Salary advance created successfully",
      data: advance,
    });
  } catch (error) {
    next(error);
  }
};

// Get all salary advances
const getAllSalaryAdvances = async (
  req,
  res,
  next
) => {
  try {
    const advances =
      await salaryAdvanceService.getAllSalaryAdvances();

    res.status(200).json({
      success: true,
      message:
        "Salary advances fetched successfully",
      data: advances,
    });
  } catch (error) {
    next(error);
  }
};

// Get salary advance by ID
const getSalaryAdvanceById = async (
  req,
  res,
  next
) => {
  try {
    const advance =
      await salaryAdvanceService.getSalaryAdvanceById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message:
        "Salary advance fetched successfully",
      data: advance,
    });
  } catch (error) {
    next(error);
  }
};

// Update salary advance
const updateSalaryAdvance = async (
  req,
  res,
  next
) => {
  try {
    const advance =
      await salaryAdvanceService.updateSalaryAdvance(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Salary advance updated successfully",
      data: advance,
    });
  } catch (error) {
    next(error);
  }
};

// Delete salary advance
const deleteSalaryAdvance = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await salaryAdvanceService.deleteSalaryAdvance(
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
  createSalaryAdvance,
  getAllSalaryAdvances,
  getSalaryAdvanceById,
  updateSalaryAdvance,
  deleteSalaryAdvance,
};