const Joi = require("joi");

const createOpeningStockSchema = Joi.object({
  location: Joi.string()
    .hex()
    .length(24)
    .required(),

  type: Joi.string()
    .valid(
      "item",
      "nail",
      "consumable"
    )
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

  // Used Item
  quantity: Joi.number()
    .min(0),

  unit: Joi.string()
    .valid("kg", "g", "pcs"),

  // New Item
  cft: Joi.number()
    .min(0),

  cubicMeter: Joi.number()
    .min(0),
});

const updateOpeningStockSchema = Joi.object({
  location: Joi.string()
    .hex()
    .length(24),

  type: Joi.string()
    .valid(
      "item",
      "nail",
      "consumable"
    ),

  category: Joi.string()
    .hex()
    .length(24),

  referenceId: Joi.string()
    .hex()
    .length(24),

  // Used Item
  quantity: Joi.number()
    .min(0),

  unit: Joi.string()
    .valid("kg", "g", "pcs"),

  // New Item
  cft: Joi.number()
    .min(0),

  cubicMeter: Joi.number()
    .min(0),

  // Pieces
  pieces: Joi.array().items(
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
  ),
}).min(1);

module.exports = {
  createOpeningStockSchema,
  updateOpeningStockSchema,
};