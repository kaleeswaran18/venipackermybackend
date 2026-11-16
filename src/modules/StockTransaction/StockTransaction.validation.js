const Joi = require("joi");


// =========================
// Create Stock Transaction
// =========================

const createStockTransactionSchema = Joi.object({
  transactionDate: Joi.date().required(),

  location: Joi.string()
    .hex()
    .length(24)
    .required(),

  type: Joi.string()
    .valid("item", "nail", "consumable")
    .required(),

  category: Joi.string()
    .hex()
    .length(24)
    .when("type", {
      is: "item",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),

  referenceId: Joi.string()
    .hex()
    .length(24)
    .required(),

  transactionType: Joi.string()
    .valid("IN", "OUT", "ADJUSTMENT")
    .required(),

  quantity: Joi.number()
    .min(0)
    .allow(null),

  unit: Joi.string()
    .valid("kg", "g", "pcs")
    .allow(null),

  cft: Joi.number()
    .min(0)
    .allow(null),

  cubicMeter: Joi.number()
    .min(0)
    .allow(null),

  pieces: Joi.array()
    .items(
      Joi.object({
        pieceSizeId: Joi.string()
          .hex()
          .length(24)
          .required(),

        width: Joi.number()
          .min(0)
          .required(),

        inch: Joi.number()
          .min(0)
          .required(),

        feet: Joi.number()
          .min(0)
          .required(),

        count: Joi.number()
          .min(0)
          .required(),
      })
    )
    .default([]),

  sourceType: Joi.string()
    .valid(
      "Purchase",
      "Consumption",
      "Production",
      "Delivery",
      "Adjustment"
    )
    .required(),

  sourceId: Joi.string()
    .hex()
    .length(24)
    .required(),

  remarks: Joi.string()
    .trim()
    .allow("")
    .default(""),
});


// =========================
// Update Stock Transaction
// =========================

const updateStockTransactionSchema = Joi.object({
  transactionDate: Joi.date().optional(),

  location: Joi.string()
    .hex()
    .length(24)
    .optional(),

  type: Joi.string()
    .valid("item", "nail", "consumable")
    .optional(),

  category: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .optional(),

  referenceId: Joi.string()
    .hex()
    .length(24)
    .optional(),

  transactionType: Joi.string()
    .valid("IN", "OUT", "ADJUSTMENT")
    .optional(),

  quantity: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  unit: Joi.string()
    .valid("kg", "g", "pcs")
    .allow(null)
    .optional(),

  cft: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  cubicMeter: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  pieces: Joi.array()
    .items(
      Joi.object({
        pieceSizeId: Joi.string()
          .hex()
          .length(24)
          .required(),

        width: Joi.number()
          .min(0)
          .required(),

        inch: Joi.number()
          .min(0)
          .required(),

        feet: Joi.number()
          .min(0)
          .required(),

        count: Joi.number()
          .min(0)
          .required(),
      })
    )
    .optional(),

  sourceType: Joi.string()
    .valid(
      "Purchase",
      "Consumption",
      "Production",
      "Delivery",
      "Adjustment"
    )
    .optional(),

  sourceId: Joi.string()
    .hex()
    .length(24)
    .optional(),

  remarks: Joi.string()
    .trim()
    .allow("")
    .optional(),
});


module.exports = {
  createStockTransactionSchema,
  updateStockTransactionSchema,
};