const express = require("express");

const router = express.Router();

const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("./item.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createItemSchema,
  updateItemSchema,
} = require("./item.validation");


// =========================
// CREATE ITEM
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createItemSchema),
  createItem
);


// =========================
// GET ALL ITEMS
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllItems
);


// =========================
// GET ITEM BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getItemById
);


// =========================
// UPDATE ITEM
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateItemSchema),
  updateItem
);


// =========================
// DELETE ITEM
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteItem
);


module.exports = router;