const Joi = require("joi");


// CREATE FINISHED MATERIAL STOCK
const createFinishedMaterialStockSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty":
        "Finished material name is required",
      "any.required":
        "Finished material name is required",
    }),

  categoryId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.empty":
        "Category is required",
      "string.hex":
        "Invalid category ID",
      "string.length":
        "Invalid category ID",
      "any.required":
        "Category is required",
    }),
});


// UPDATE FINISHED MATERIAL STOCK
const updateFinishedMaterialStockSchema =
  Joi.object({
    name: Joi.string()
      .trim(),

    categoryId: Joi.string()
      .hex()
      .length(24)
      .messages({
        "string.hex":
          "Invalid category ID",
        "string.length":
          "Invalid category ID",
      }),
  }).min(1);


module.exports = {
  createFinishedMaterialStockSchema,
  updateFinishedMaterialStockSchema,
};