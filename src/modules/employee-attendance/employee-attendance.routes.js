
const express = require("express");

const router = express.Router();

const {
  createEmployeeAttendance,
  getAllEmployeeAttendance,
  getEmployeeAttendanceById,
  updateEmployeeAttendance,
  deleteEmployeeAttendance,
  getTodayLocationAttendanceSummary,
} = require("./employee-attendance.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createEmployeeAttendanceSchema,
  updateEmployeeAttendanceSchema,
} = require("./employee-attendance.validation");

// =========================
// CREATE EMPLOYEE ATTENDANCE
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createEmployeeAttendanceSchema),
  createEmployeeAttendance
);

// =========================
// GET ALL EMPLOYEE ATTENDANCE
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllEmployeeAttendance
);

// =========================
// GET TODAY LOCATION-WISE ATTENDANCE SUMMARY
// Admin + Owner
// IMPORTANT: Keep this ABOVE /:id
// =========================

router.get(
  "/today-location-summary",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getTodayLocationAttendanceSummary
);

// =========================
// GET EMPLOYEE ATTENDANCE BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getEmployeeAttendanceById
);

// =========================
// UPDATE EMPLOYEE ATTENDANCE
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateEmployeeAttendanceSchema),
  updateEmployeeAttendance
);

// =========================
// DELETE EMPLOYEE ATTENDANCE
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteEmployeeAttendance
);

module.exports = router;
