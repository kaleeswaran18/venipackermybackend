const Joi = require("joi");

// CREATE FINISHED MATERIAL STOCK
const createFinishedMaterialStockSchema = Joi.object({
  finishedMaterialId: Joi.string()
    .required(),

  locationId: Joi.string()
    .required(),

  quantity: Joi.number()
    .min(0)
    .required(),

  date: Joi.date()
    .required(),
});


// UPDATE FINISHED MATERIAL STOCK
const updateFinishedMaterialStockSchema = Joi.object({
  finishedMaterialId: Joi.string()
    .optional(),

  locationId: Joi.string()
    .optional(),

  quantity: Joi.number()
    .min(0)
    .optional(),

  date: Joi.date()
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});


module.exports = {
  createFinishedMaterialStockSchema,
  updateFinishedMaterialStockSchema,
};