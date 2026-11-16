const Joi = require("joi");

const createItemCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Category name is required",
      "string.min": "Category name must be at least 2 characters",
      "string.max": "Category name must not exceed 100 characters",
      "any.required": "Category name is required",
    }),
});

const updateItemCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  isActive: Joi.boolean(),
});

module.exports = {
  createItemCategorySchema,
  updateItemCategorySchema,
};