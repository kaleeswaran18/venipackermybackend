
const Employee = require("./employee.model");
const Location = require("../locations/location.model");

// =========================
// GENERATE EMPLOYEE CODE
// =========================

const generateEmployeeCode = async () => {
  const lastEmployee = await Employee.findOne()
    .sort({ createdAt: -1 })
    .select("employeeCode");

  if (!lastEmployee) {
    return "EMP001";
  }

  const lastCode = lastEmployee.employeeCode;

  const number = parseInt(
    lastCode.replace("EMP", ""),
    10
  );

  const nextNumber = number + 1;

  return `EMP${String(nextNumber).padStart(3, "0")}`;
};


// =========================
// CREATE EMPLOYEE
// =========================

const createEmployee = async (data) => {
  const {
    name,
    phone,
    permanentLocationId,
    joiningDate,
    dailyWage,
    isActive,
  } = data;

  // Check location exists
  const location = await Location.findById(
    permanentLocationId
  );

  if (!location) {
    throw new Error(
      "Permanent location not found"
    );
  }

  // Generate employee code automatically
  const employeeCode =
    await generateEmployeeCode();

  // Create employee
  const employee = await Employee.create({
    employeeCode,
    name,
    phone,
    permanentLocationId,
    joiningDate,
    dailyWage,
    isActive,
  });

  return employee;
};


// =========================
// GET ALL EMPLOYEES
// =========================

const getAllEmployees = async () => {
  const employees = await Employee.find()
    .populate(
      "permanentLocationId",
      "_id name"
    )
    .sort({ createdAt: 1 });

  return employees;
};


// =========================
// GET EMPLOYEE BY ID
// =========================

const getEmployeeById = async (employeeId) => {
  const employee = await Employee.findById(
    employeeId
  ).populate(
    "permanentLocationId",
    "_id name"
  );

  if (!employee) {
    throw new Error("Employee not found");
  }

  return employee;
};


// =========================
// UPDATE EMPLOYEE
// =========================

const updateEmployee = async (
  employeeId,
  data
) => {
  const employee = await Employee.findById(
    employeeId
  );

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Check location
  if (data.permanentLocationId) {
    const location =
      await Location.findById(
        data.permanentLocationId
      );

    if (!location) {
      throw new Error(
        "Permanent location not found"
      );
    }

    employee.permanentLocationId =
      data.permanentLocationId;
  }

  if (data.name !== undefined) {
    employee.name = data.name;
  }

  if (data.phone !== undefined) {
    employee.phone = data.phone;
  }

  if (data.joiningDate !== undefined) {
    employee.joiningDate =
      data.joiningDate;
  }

  if (data.dailyWage !== undefined) {
    employee.dailyWage =
      data.dailyWage;
  }

  if (data.isActive !== undefined) {
    employee.isActive =
      data.isActive;
  }

  await employee.save();

  return employee;
};


// =========================
// DELETE EMPLOYEE
// =========================

const deleteEmployee = async (
  employeeId
) => {
  const employee = await Employee.findById(
    employeeId
  );

  if (!employee) {
    throw new Error("Employee not found");
  }

  await Employee.findByIdAndDelete(
    employeeId
  );

  return {
    id: employee._id,
    message: "Employee deleted successfully",
  };
};


module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
