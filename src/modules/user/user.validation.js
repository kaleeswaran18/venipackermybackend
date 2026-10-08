const Joi = require("joi");

// UPDATE USER
const updateUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .optional(),

  role: Joi.string()
    .valid(
      "admin",
      "owner",
      "business_executive"
    )
    .optional(),
});

// UPDATE USER STATUS
const updateStatusSchema = Joi.object({
  isActive: Joi.boolean()
    .required(),
});

module.exports = {
  updateUserSchema,
  updateStatusSchema,
};