
const express = require("express");

const router = express.Router();

const nailPackingController = require("./nail-packing.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  getNailPackingSchema,
  updateNailPackingDailySchema,
} = require("./nail-packing.validation");

// GET Monthly Nail Packing Report
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  (req, res, next) => {
    const { month, year } = req.query;

    const { error } = getNailPackingSchema.validate({
      month: Number(month),
      year: Number(year),
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    next();
  },
  nailPackingController.getNailPackingReport
);

// UPDATE Daily Nail Packing Entry
router.patch(
  "/:id/date/:date",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(updateNailPackingDailySchema),
  nailPackingController.updateNailPackingDaily
);

module.exports = router;
