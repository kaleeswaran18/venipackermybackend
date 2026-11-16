const employeeService = require("./employee.service");

// =========================
// CREATE EMPLOYEE
// =========================

const createEmployee = async (req, res, next) => {
  try {
    const employee =
      await employeeService.createEmployee(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ALL EMPLOYEES
// =========================

const getAllEmployees = async (req, res, next) => {
  try {
    const employees =
      await employeeService.getAllEmployees();

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET EMPLOYEE BY ID
// =========================

const getEmployeeById = async (req, res, next) => {
  try {
    const employee =
      await employeeService.getEmployeeById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// UPDATE EMPLOYEE
// =========================

const updateEmployee = async (req, res, next) => {
  try {
    const employee =
      await employeeService.updateEmployee(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// DELETE EMPLOYEE
// =========================

const deleteEmployee = async (req, res, next) => {
  try {
    const result =
      await employeeService.deleteEmployee(
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
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};