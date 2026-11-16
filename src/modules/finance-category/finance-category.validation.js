const Joi = require("joi");

// =========================
// CREATE FINANCE CATEGORY
// =========================

const createFinanceCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  type: Joi.string()
    .valid("income", "expense")
    .required(),

  description: Joi.string()
    .trim()
    .max(500)
    .allow("", null)
    .optional(),
});

// =========================
// UPDATE FINANCE CATEGORY
// =========================

const updateFinanceCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  type: Joi.string()
    .valid("income", "expense")
    .optional(),

  description: Joi.string()
    .trim()
    .max(500)
    .allow("", null)
    .optional(),
}).min(1);

module.exports = {
  createFinanceCategorySchema,
  updateFinanceCategorySchema,
};