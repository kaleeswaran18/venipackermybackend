const Joi = require("joi");

// CREATE CONSUMABLE
const createConsumableSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),
});

// UPDATE CONSUMABLE
const updateConsumableSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});

module.exports = {
  createConsumableSchema,
  updateConsumableSchema,
};