
const express = require("express");

const router = express.Router();

const {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  createRentPayment,
} = require("./property.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createPropertySchema,
  updatePropertySchema,
  createRentPaymentSchema,
} = require("./property.validation");

// CREATE PROPERTY
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(createPropertySchema),
  createProperty
);

// GET ALL PROPERTIES
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllProperties
);

// GET PROPERTY BY ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getPropertyById
);

// CREATE RENT PAYMENT
router.post(
  "/:id/rent-payment",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(createRentPaymentSchema),
  createRentPayment
);

// UPDATE PROPERTY
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(updatePropertySchema),
  updateProperty
);

// DELETE PROPERTY
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProperty
);

module.exports = router;
