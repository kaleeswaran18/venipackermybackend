const Joi = require("joi");

// CREATE LOCATION
const createLocationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),
});

// UPDATE LOCATION
const updateLocationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});

module.exports = {
  createLocationSchema,
  updateLocationSchema,
};