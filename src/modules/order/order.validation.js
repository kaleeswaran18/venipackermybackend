
const Joi = require("joi");

const objectId = Joi.string()
  .hex()
  .length(24);

// =========================
// FIELD VALIDATION
// =========================

const fieldSchema = Joi.object({
  fieldId: objectId.required(),

  fieldName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required(),

  requestedQuantity: Joi.number()
    .positive()
    .required(),
});

// =========================
// PRODUCT VALIDATION
// =========================

const productSchema = Joi.object({
  finishedMaterialCategoryId: objectId.required(),

  finishedMaterialCategoryName: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required(),

  productId: objectId.required(),

  productName: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required(),

  size: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .optional(),

  fields: Joi.array()
    .items(fieldSchema)
    .min(1)
    .required(),

  ratePerPiece: Joi.number()
    .min(0)
    .required(),

  amount: Joi.number()
    .min(0)
    .required(),
});

// =========================
// PAYMENT HISTORY VALIDATION
// =========================

const paymentHistorySchema = Joi.object({
  _id: objectId.optional(),

  paymentDate: Joi.date()
    .required(),

  paymentAmount: Joi.number()
    .min(0)
    .required(),

  paymentMode: Joi.string()
    .valid(
      "Cash",
      "Bank Transfer",
      "UPI",
      "Cheque",
      "Other"
    )
    .required(),

  referenceNumber: Joi.string()
    .trim()
    .max(200)
    .allow("")
    .optional(),

  remarks: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .optional(),
});

// =========================
// CREATE ORDER
// =========================

const createOrderSchema = Joi.object({
  source: Joi.string()
    .valid(
      "From Enquiry",
      "Direct Order"
    )
    .required(),

  enquiryId: objectId
    .allow(null)
    .optional(),

  enquiryNo: Joi.string()
    .trim()
    .max(50)
    .when("source", {
      is: "From Enquiry",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  customerName: Joi.string()
    .trim()
    .min(2)
    .max(100)
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

  // COMPANY
  companyId: objectId.required(),

  customerLocation: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  originalRequirement: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .required(),

  additionalDetails: Joi.string()
    .trim()
    .max(2000)
    .allow("", null)
    .optional(),

  deliveryAddress: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .required(),

  assignedLocation: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  startDate: Joi.date()
    .required(),

  endDate: Joi.date()
    .greater(Joi.ref("startDate"))
    .required(),

  // =========================
  // PRODUCTS
  // =========================

  products: Joi.array()
    .items(productSchema)
    .min(1)
    .required(),

  // =========================
  // AMOUNT DETAILS
  // =========================

  subTotal: Joi.number()
    .min(0)
    .required(),

  taxPercentage: Joi.number()
    .min(0)
    .max(100)
    .required(),

  taxAmount: Joi.number()
    .min(0)
    .required(),

  totalAmount: Joi.number()
    .min(0)
    .required(),

  // =========================
  // REMARKS
  // =========================

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .optional(),

  // =========================
  // PAYMENT
  // =========================

  alreadyPaidAmount: Joi.number()
    .min(0)
    .optional(),

  pendingAmount: Joi.number()
    .min(0)
    .optional(),

  paymentStatus: Joi.string()
    .valid(
      "Not Received",
      "Partially Received",
      "Fully Received"
    )
    .optional(),

  paymentHistory: Joi.array()
    .items(paymentHistorySchema)
    .optional(),

  // =========================
  // DELIVERY
  // =========================

  deliveryStatus: Joi.string()
    .valid(
      "Pending",
      "Partially Delivered",
      "Delivered",
      "Cancelled"
    )
    .optional(),
});

// =========================
// UPDATE FIELD VALIDATION
// =========================

const updateFieldSchema = Joi.object({
  fieldId: objectId.optional(),

  fieldName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  requestedQuantity: Joi.number()
    .positive()
    .optional(),
});

// =========================
// UPDATE PRODUCT VALIDATION
// =========================

const updateProductSchema = Joi.object({
  _id: objectId.optional(),

  finishedMaterialCategoryId: objectId.optional(),

  finishedMaterialCategoryName: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .optional(),

  productId: objectId.optional(),

  productName: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .optional(),

  size: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .optional(),

  fields: Joi.array()
    .items(updateFieldSchema)
    .min(1)
    .optional(),

  ratePerPiece: Joi.number()
    .min(0)
    .optional(),

  amount: Joi.number()
    .min(0)
    .optional(),
});

// =========================
// UPDATE ORDER
// =========================

const updateOrderSchema = Joi.object({
  source: Joi.string()
    .valid(
      "From Enquiry",
      "Direct Order"
    )
    .optional(),

  enquiryId: objectId
    .allow(null)
    .optional(),

  enquiryNo: Joi.string()
    .trim()
    .max(50)
    .allow("", null)
    .optional(),

  customerName: Joi.string()
    .trim()
    .min(2)
    .max(100)
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

  // COMPANY
  companyId: objectId.optional(),

  customerLocation: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  originalRequirement: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .optional(),

  additionalDetails: Joi.string()
    .trim()
    .max(2000)
    .allow("", null)
    .optional(),

  deliveryAddress: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .optional(),

  assignedLocation: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  startDate: Joi.date()
    .optional(),

  endDate: Joi.date()
    .optional(),

  // =========================
  // PRODUCTS
  // =========================

  products: Joi.array()
    .items(updateProductSchema)
    .min(1)
    .optional(),

  // =========================
  // AMOUNT DETAILS
  // =========================

  subTotal: Joi.number()
    .min(0)
    .optional(),

  taxPercentage: Joi.number()
    .min(0)
    .max(100)
    .optional(),

  taxAmount: Joi.number()
    .min(0)
    .optional(),

  totalAmount: Joi.number()
    .min(0)
    .optional(),

  // =========================
  // REMARKS
  // =========================

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .optional(),

  // =========================
  // PAYMENT
  // =========================

  alreadyPaidAmount: Joi.number()
    .min(0)
    .optional(),

  pendingAmount: Joi.number()
    .min(0)
    .optional(),

  paymentStatus: Joi.string()
    .valid(
      "Not Received",
      "Partially Received",
      "Fully Received"
    )
    .optional(),

  paymentHistory: Joi.array()
    .items(paymentHistorySchema)
    .optional(),

  // =========================
  // DELIVERY
  // =========================

  deliveryStatus: Joi.string()
    .valid(
      "Pending",
      "Partially Delivered",
      "Delivered",
      "Cancelled"
    )
    .optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
};
