const Joi = require("joi");

// CREATE FINISHED MATERIAL
const createFinishedMaterialSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),
});

// UPDATE FINISHED MATERIAL
const updateFinishedMaterialSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});

module.exports = {
  createFinishedMaterialSchema,
  updateFinishedMaterialSchema,
};