
const employeeAttendanceService = require("./employee-attendance.service");

// =========================
// CREATE EMPLOYEE ATTENDANCE
// =========================

const createEmployeeAttendance = async (
  req,
  res,
  next
) => {
  try {
    const attendance =
      await employeeAttendanceService.createEmployeeAttendance(
        req.body,
        req.user._id
      );

    res.status(201).json({
      success: true,
      message:
        "Employee attendance created successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ALL EMPLOYEE ATTENDANCE
// =========================

const getAllEmployeeAttendance = async (
  req,
  res,
  next
) => {
  try {
    const attendance =
      await employeeAttendanceService.getAllEmployeeAttendance();

    res.status(200).json({
      success: true,
      message:
        "Employee attendance fetched successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET EMPLOYEE ATTENDANCE BY ID
// =========================

const getEmployeeAttendanceById = async (
  req,
  res,
  next
) => {
  try {
    const attendance =
      await employeeAttendanceService.getEmployeeAttendanceById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message:
        "Employee attendance fetched successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};
// =========================
// GET TODAY LOCATION-WISE ATTENDANCE SUMMARY
// =========================

const getTodayLocationAttendanceSummary = async (
  req,
  res,
  next
) => {
  try {
    const summary =
      await employeeAttendanceService.getTodayLocationAttendanceSummary();

    res.status(200).json({
      success: true,
      message:
        "Today's location-wise attendance fetched successfully",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE EMPLOYEE ATTENDANCE
// =========================

const updateEmployeeAttendance = async (
  req,
  res,
  next
) => {
  try {
    const attendance =
      await employeeAttendanceService.updateEmployeeAttendance(
        req.params.id,
        req.body,
        req.user._id
      );

    res.status(200).json({
      success: true,
      message:
        "Employee attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// DELETE EMPLOYEE ATTENDANCE
// =========================

const deleteEmployeeAttendance = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await employeeAttendanceService.deleteEmployeeAttendance(
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
  createEmployeeAttendance,
  getAllEmployeeAttendance,
  getEmployeeAttendanceById,
  updateEmployeeAttendance,
  deleteEmployeeAttendance,
  getTodayLocationAttendanceSummary,
};
