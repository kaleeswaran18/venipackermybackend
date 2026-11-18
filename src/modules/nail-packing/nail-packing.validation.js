const Joi = require("joi");

const getNailPackingSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
});

const updateNailPackingDailySchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().min(0).required(),
      })
    )
    .required(),

  remarks: Joi.string().trim().allow("").max(500).default(""),
});

module.exports = {
  getNailPackingSchema,
  updateNailPackingDailySchema,
};