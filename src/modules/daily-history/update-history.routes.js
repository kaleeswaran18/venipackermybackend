const express = require("express");

const router = express.Router();

const {
  createUpdateHistoryController,
  getUpdateHistoriesByDailyHistoryController,
  getUpdateHistoryByIdController,
} = require("./update-history.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

// Get update history for a particular daily history
router.get(
  "/daily/:dailyHistoryId",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getUpdateHistoriesByDailyHistoryController
);

// Get single update history
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getUpdateHistoryByIdController
);

// Create update history
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createUpdateHistoryController
);

module.exports = router;