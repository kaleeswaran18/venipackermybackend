const express = require("express");

const router = express.Router();

const {
  createWeeklySalary,
  getAllWeeklySalary,
  getWeeklySalaryById,
  updateWeeklySalary,
  deleteWeeklySalary,
} = require("./weekly-salary.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createWeeklySalarySchema,
  updateWeeklySalarySchema,
} = require("./weekly-salary.validation");

// Create weekly salary
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createWeeklySalarySchema),
  createWeeklySalary
);

// Get all weekly salaries
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllWeeklySalary
);

// Get weekly salary by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getWeeklySalaryById
);

// Update weekly salary
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateWeeklySalarySchema),
  updateWeeklySalary
);

// Delete weekly salary
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteWeeklySalary
);

module.exports = router;