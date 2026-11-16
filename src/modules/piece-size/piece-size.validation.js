const Joi = require("joi");

const createPieceSizeSchema = Joi.object({
  width: Joi.number()
    .min(0)
    .required(),

  inch: Joi.number()
    .min(0)
    .required(),

  feet: Joi.number()
    .min(0)
    .required(),
});

const updatePieceSizeSchema = Joi.object({
  width: Joi.number()
    .min(0),

  inch: Joi.number()
    .min(0),

  feet: Joi.number()
    .min(0),
}).min(1);

module.exports = {
  createPieceSizeSchema,
  updatePieceSizeSchema,
};