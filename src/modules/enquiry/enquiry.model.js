const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    enquiryNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    // Company Master Reference
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      enum: [
        "Just Dial",
        "India Mart",
        "Direct",
        "Reference",
        "Other",
      ],
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    requirement: {
      type: String,
      required: true,
      trim: true,
    },

    details: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Waiting",
        "High Rate",
        "Purchased",
        "Long Distance",
        "Follow Up",
        "Converted to Order",
        "Cancelled",
      ],
      default: "Waiting",
    },

    // orderId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Order",
    //   default: null,
    // },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Enquiry", enquirySchema);