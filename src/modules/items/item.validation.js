const Joi = require("joi");

// CREATE ITEM
const createItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),
});


// UPDATE ITEM
const updateItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
});


module.exports = {
  createItemSchema,
  updateItemSchema,
};