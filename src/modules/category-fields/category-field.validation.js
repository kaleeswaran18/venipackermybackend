const Joi = require("joi");

const createCategoryFieldSchema = Joi.object({
  categoryId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.empty": "Category is required",
      "string.hex": "Invalid category ID",
      "string.length": "Invalid category ID",
      "any.required": "Category is required",
    }),

  key: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "Field key is required",
      "string.min": "Field key must be at least 2 characters",
      "string.max": "Field key must not exceed 50 characters",
      "any.required": "Field key is required",
    }),

  label: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Field label is required",
      "string.min": "Field label must be at least 2 characters",
      "string.max": "Field label must not exceed 100 characters",
      "any.required": "Field label is required",
    }),

  type: Joi.string()
    .valid("number", "text", "select")
    .default("number"),

  order: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Order must be a number",
      "number.integer": "Order must be an integer",
      "number.min": "Order must be at least 1",
      "any.required": "Order is required",
    }),
});

const updateCategoryFieldSchema = Joi.object({
  categoryId: Joi.string()
    .hex()
    .length(24),

  key: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(50),

  label: Joi.string()
    .trim()
    .min(2)
    .max(100),

  type: Joi.string()
    .valid("number", "text", "select"),

  order: Joi.number()
    .integer()
    .min(1),

  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createCategoryFieldSchema,
  updateCategoryFieldSchema,
};