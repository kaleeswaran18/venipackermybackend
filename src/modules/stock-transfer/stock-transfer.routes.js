const express = require("express");

const router = express.Router();

const {
  createStockTransfer,
  getAllStockTransfers,
  getStockTransfersByLocation,
  updateStockTransfer,
} = require("./stock-transfer.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createStockTransferValidation,
  updateStockTransferValidation,
} = require("./stock-transfer.validation");

// Authentication
router.use(authMiddleware);

// CREATE STOCK TRANSFER
router.post(
  "/",
  validationMiddleware(createStockTransferValidation),
  createStockTransfer
);

// GET ALL STOCK TRANSFERS
router.get("/", getAllStockTransfers);

// GET STOCK TRANSFERS BY LOCATION
router.get(
  "/location/:locationId",
  getStockTransfersByLocation
);

// UPDATE STOCK TRANSFER
router.patch(
  "/:id",
  validationMiddleware(updateStockTransferValidation),
  updateStockTransfer
);

module.exports = router;