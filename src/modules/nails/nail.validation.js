const Joi = require("joi");

// CREATE NAIL
const createNailSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),
});


// UPDATE NAIL
const updateNailSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});


module.exports = {
  createNailSchema,
  updateNailSchema,
};