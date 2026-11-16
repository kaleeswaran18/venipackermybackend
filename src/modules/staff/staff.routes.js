
const express = require("express");

const router = express.Router();

const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  generateMonthlyAttendance,
  updateAttendance,
  updateMonthlyPayment,
} = require("./staff.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createStaffSchema,
  updateStaffSchema,
  generateMonthlyAttendanceSchema,
  updateAttendanceSchema,
} = require("./staff.validation");

// =========================
// STAFF ROUTES
// =========================

// Create Staff
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createStaffSchema),
  createStaff
);

// Get All Staff
router.get(
  "/",
  authMiddleware,
  getAllStaff
);

// Get Staff By ID
router.get(
  "/:id",
  authMiddleware,
  getStaffById
);

// Update Staff
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateStaffSchema),
  updateStaff
);

// Delete Staff
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteStaff
);

// =========================
// MONTHLY ATTENDANCE ROUTES
// =========================

// Generate Monthly Attendance
router.post(
  "/generate-monthly-attendance",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(generateMonthlyAttendanceSchema),
  generateMonthlyAttendance
);

// Update Daily Attendance
router.patch(
  "/:staffId/attendance",
  authMiddleware,
  validationMiddleware(updateAttendanceSchema),
  updateAttendance
);
router.patch(
  "/:id/payment",
  authMiddleware,
  roleMiddleware("admin"),
  updateMonthlyPayment
);
module.exports = router;
