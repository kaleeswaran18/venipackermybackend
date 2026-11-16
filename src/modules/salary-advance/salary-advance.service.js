const SalaryAdvance = require("./salary-advance.model");
const Employee = require("../employee/employee.model");

// Create salary advance
const createSalaryAdvance = async (data) => {
  const {
    employeeId,
    date,
    amount,
    remark,
  } = data;

  // Check employee
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new Error("Employee not found");
  }

  const advance = await SalaryAdvance.create({
    employeeId,
    date,
    amount,
    remark,
  });

  return advance;
};

// Get all salary advances
const getAllSalaryAdvances = async () => {
  return await SalaryAdvance.find()
    .populate(
      "employeeId",
      "_id employeeCode name"
    )
    .sort({
      date: -1,
      createdAt: -1,
    });
};

// Get salary advance by ID
const getSalaryAdvanceById = async (id) => {
  const advance =
    await SalaryAdvance.findById(id).populate(
      "employeeId",
      "_id employeeCode name"
    );

  if (!advance) {
    throw new Error("Salary advance not found");
  }

  return advance;
};

// Update salary advance
const updateSalaryAdvance = async (
  id,
  data
) => {
  const advance =
    await SalaryAdvance.findById(id);

  if (!advance) {
    throw new Error("Salary advance not found");
  }

  // Check employee if employeeId is changed
  if (data.employeeId) {
    const employee = await Employee.findById(
      data.employeeId
    );

    if (!employee) {
      throw new Error("Employee not found");
    }
  }

  Object.assign(advance, data);

  await advance.save();

  return advance;
};

// Delete salary advance
const deleteSalaryAdvance = async (id) => {
  const advance =
    await SalaryAdvance.findById(id);

  if (!advance) {
    throw new Error("Salary advance not found");
  }

  await SalaryAdvance.findByIdAndDelete(id);

  return {
    message:
      "Salary advance deleted successfully",
    id,
  };
};

module.exports = {
  createSalaryAdvance,
  getAllSalaryAdvances,
  getSalaryAdvanceById,
  updateSalaryAdvance,
  deleteSalaryAdvance,
};