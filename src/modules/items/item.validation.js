const Joi = require("joi");

// CREATE ITEM
const createItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  category: Joi.string()
    .valid("Used Items", "New Items")
    .required(),
});


// UPDATE ITEM
const updateItemSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  category: Joi.string()
    .valid("Used Items", "New Items")
    .optional(),

  isActive: Joi.boolean()
    .optional(),
});


module.exports = {
  createItemSchema,
  updateItemSchema,
};