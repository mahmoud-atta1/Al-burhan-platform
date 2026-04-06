const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    weekId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Week",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    availableFrom: {
      type: Date,
    },

    availableUntil: {
      type: Date,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

examSchema.index({ weekId: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("Exam", examSchema);
