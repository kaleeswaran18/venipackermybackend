
const Joi = require("joi");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dailyLogSchema = Joi.object({
  type: Joi.string()
    .valid("work", "visitor")
    .required(),

  date: Joi.date().required(),

  location: Joi.string()
    .pattern(objectIdPattern)
    .required(),

  // Work Log
  personName: Joi.when("type", {
    is: "work",
    then: Joi.string().trim().required(),
    otherwise: Joi.string().allow("", null),
  }),

  assignedWork: Joi.when("type", {
    is: "work",
    then: Joi.string().trim().required(),
    otherwise: Joi.string().allow("", null),
  }),

  remarks: Joi.string().allow("", null),

  // Visitor Log
  visitorName: Joi.when("type", {
    is: "visitor",
    then: Joi.string().trim().required(),
    otherwise: Joi.string().allow("", null),
  }),

  purpose: Joi.when("type", {
    is: "visitor",
    then: Joi.string().trim().required(),
    otherwise: Joi.string().allow("", null),
  }),

  visitDetails: Joi.string().allow("", null),

  arrivalTime: Joi.when("type", {
    is: "visitor",
    then: Joi.string().pattern(timePattern).required(),
    otherwise: Joi.string().allow("", null),
  }),
});

module.exports = {
  dailyLogSchema,
};
