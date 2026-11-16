
const staffService = require("./staff.service");

// =========================
// CREATE STAFF
// =========================

const createStaff = async (req, res, next) => {
  try {
    const staff = await staffService.createStaff(req.body);

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ALL STAFF
// =========================

const getAllStaff = async (req, res, next) => {
  try {
    const staff = await staffService.getAllStaff(req.query);

    return res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET STAFF BY ID
// =========================

const getStaffById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE STAFF
// =========================

const updateStaff = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaff(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// DELETE STAFF
// =========================

const deleteStaff = async (req, res, next) => {
  try {
    const staff = await staffService.deleteStaff(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Staff deleted successfully",
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GENERATE MONTHLY ATTENDANCE
// =========================

const generateMonthlyAttendance = async (req, res, next) => {
  try {
    const result = await staffService.generateMonthlyAttendance(
      req.body.month,
      req.body.year
    );

    return res.status(200).json({
      success: true,
      message: "Monthly attendance generated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE DAILY ATTENDANCE
// =========================

const updateAttendance = async (req, res, next) => {
  try {
   console.log("FULL REQUEST BODY:", JSON.stringify(req.body, null, 2));
console.log("CONTENT TYPE:", req.headers["content-type"]);
    const result = await staffService.updateAttendance(
      req.params.staffId,
      req.body,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
// =========================
// UPDATE MONTHLY SALARY PAYMENT
// =========================

const updateMonthlyPayment = async (req, res, next) => {
  try {
    const result = await staffService.updateMonthlyPayment(
      req.params.id,
      req.body,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: "Monthly salary payment updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
// =========================
// EXPORTS
// =========================

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  generateMonthlyAttendance,
  updateAttendance,
  updateMonthlyPayment
};
