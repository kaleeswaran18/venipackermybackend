const Joi = require("joi");

const objectId = Joi.string()
  .hex()
  .length(24);

// =========================
// CREATE ENQUIRY
// =========================

const createEnquirySchema = Joi.object({
  date: Joi.date().required(),

  customerName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  companyId: objectId.required(),

  companyName: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required(),

  phone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .required(),

  platform: Joi.string()
    .valid(
      "Just Dial",
      "India Mart",
      "Direct",
      "Reference",
      "Other"
    )
    .required(),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  requirement: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .required(),

  details: Joi.string()
    .trim()
    .max(2000)
    .allow("", null)
    .optional(),

  status: Joi.string()
    .valid(
      "Waiting",
      "High Rate",
      "Purchased",
      "Long Distance",
      "Follow Up",
      "Converted to Order",
      "Cancelled"
    )
    .optional(),
});

// =========================
// UPDATE ENQUIRY
// =========================

const updateEnquirySchema = Joi.object({
  date: Joi.date().optional(),

  customerName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  companyId: objectId.optional(),

  companyName: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .optional(),

  phone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .optional(),

  platform: Joi.string()
    .valid(
      "Just Dial",
      "India Mart",
      "Direct",
      "Reference",
      "Other"
    )
    .optional(),

  location: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  requirement: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .optional(),

  details: Joi.string()
    .trim()
    .max(2000)
    .allow("", null)
    .optional(),

  status: Joi.string()
    .valid(
      "Waiting",
      "High Rate",
      "Purchased",
      "Long Distance",
      "Follow Up",
      "Converted to Order",
      "Cancelled"
    )
    .optional(),

  orderId: objectId
    .allow(null)
    .optional(),
});

module.exports = {
  createEnquirySchema,
  updateEnquirySchema,
};