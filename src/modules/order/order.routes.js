const express = require("express");

const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("./order.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createOrderSchema,
  updateOrderSchema,
} = require("./order.validation");

// =========================
// CREATE ORDER
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(createOrderSchema),
  createOrder
);

// =========================
// GET ALL ORDERS
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllOrders
);

// =========================
// GET ORDER BY ID
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getOrderById
);

// =========================
// UPDATE ORDER
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(updateOrderSchema),
  updateOrder
);

// =========================
// DELETE ORDER
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteOrder
);

module.exports = router;