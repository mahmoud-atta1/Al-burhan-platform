const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    parentPhone: {
      type: String,
      trim: true,
    },

    governorate: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,

    passwordResetVerified: {
      type: Boolean,
      default: false,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
    },

    educationLevel: {
      type: String,
      enum: ["first_secondary", "second_secondary", "third_secondary"],
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

module.exports = mongoose.model("User", userSchema);
