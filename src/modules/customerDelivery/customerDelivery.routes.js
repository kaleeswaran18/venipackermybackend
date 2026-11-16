const express = require("express");

const {
  getCustomerDeliveries,
  getCustomerDeliveryById,
  updateCustomerDelivery,
} = require("./customerDelivery.controller");

const router = express.Router();

router.get("/", getCustomerDeliveries);

router.get("/:id", getCustomerDeliveryById);

router.patch("/:id", updateCustomerDelivery);

module.exports = router;