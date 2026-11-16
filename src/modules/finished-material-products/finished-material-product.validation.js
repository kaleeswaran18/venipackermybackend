const Joi = require("joi");

const createFinishedMaterialProductSchema = Joi.object({
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

  companyName: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .messages({
      "string.max": "Company name must not exceed 100 characters",
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Product name is required",
      "string.min": "Product name must be at least 2 characters",
      "string.max": "Product name must not exceed 100 characters",
      "any.required": "Product name is required",
    }),
});

const updateFinishedMaterialProductSchema = Joi.object({
  categoryId: Joi.string()
    .hex()
    .length(24)
    .messages({
      "string.hex": "Invalid category ID",
      "string.length": "Invalid category ID",
    }),

  companyName: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .messages({
      "string.max": "Company name must not exceed 100 characters",
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      "string.min": "Product name must be at least 2 characters",
      "string.max": "Product name must not exceed 100 characters",
    }),

  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createFinishedMaterialProductSchema,
  updateFinishedMaterialProductSchema,
};