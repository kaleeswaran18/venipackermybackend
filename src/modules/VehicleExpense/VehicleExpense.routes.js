const express = require("express");
const router = express.Router();

const {
  create,
  getAll,
  getById,
  update,
  remove,
} = require("./VehicleExpense.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createVehicleExpenseSchema,
  updateVehicleExpenseSchema,
} = require("./VehicleExpense.validation");

// CREATE
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(
    createVehicleExpenseSchema
  ),
  create
);

// GET ALL
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAll
);

// GET BY ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getById
);

// UPDATE
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(
    updateVehicleExpenseSchema
  ),
  update
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  remove
);

module.exports = router;