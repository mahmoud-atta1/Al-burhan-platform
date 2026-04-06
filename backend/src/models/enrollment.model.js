const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "canceled", "expired"],
      default: "pending",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    paymentScreenshot: {
      type: String,
      trim: true,
    },

    enrolledAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
