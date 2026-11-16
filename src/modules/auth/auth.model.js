const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

  role: {
  type: String,
  enum: ["systemadmin", "owner", "business_executive", "supervisor",'admin'],
  default: "systemadmin",
},

staffId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Staff",
  default: null,
},

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);