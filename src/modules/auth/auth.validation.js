const Joi = require("joi");


// =========================
// REGISTER VALIDATION
// =========================

const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .max(50)
    .required(),

  role: Joi.string()
    .valid(
      "admin",
      "owner",
      "business_executive"
    )
    .optional(),
});


// =========================
// LOGIN VALIDATION
// =========================

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required(),

  password: Joi.string()
    .required(),
});


module.exports = {
  registerSchema,
  loginSchema,
};