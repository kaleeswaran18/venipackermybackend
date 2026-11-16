const Joi = require("joi");

const createOverallStockSchema = Joi.object({
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

  productId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.empty": "Product is required",
      "string.hex": "Invalid product ID",
      "string.length": "Invalid product ID",
      "any.required": "Product is required",
    }),
});

const updateOverallStockSchema = Joi.object({
  categoryId: Joi.string()
    .hex()
    .length(24)
    .messages({
      "string.hex": "Invalid category ID",
      "string.length": "Invalid category ID",
    }),

  productId: Joi.string()
    .hex()
    .length(24)
    .messages({
      "string.hex": "Invalid product ID",
      "string.length": "Invalid product ID",
    }),

  locationId: Joi.string()
    .hex()
    .length(24)
    .messages({
      "string.hex": "Invalid location ID",
      "string.length": "Invalid location ID",
    }),

  values: Joi.object(),

}).min(1);

module.exports = {
  createOverallStockSchema,
  updateOverallStockSchema,
};