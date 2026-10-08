const express = require("express");

const router = express.Router();

const {
  createConsumable,
  getAllConsumables,
  getConsumableById,
  updateConsumable,
  deleteConsumable,
} = require("./consumable.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createConsumableSchema,
  updateConsumableSchema,
} = require("./consumable.validation");

// CREATE CONSUMABLE
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createConsumableSchema),
  createConsumable
);

// GET ALL CONSUMABLES
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllConsumables
);

// GET CONSUMABLE BY ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getConsumableById
);

// UPDATE CONSUMABLE
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateConsumableSchema),
  updateConsumable
);

// DELETE CONSUMABLE
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteConsumable
);

module.exports = router;