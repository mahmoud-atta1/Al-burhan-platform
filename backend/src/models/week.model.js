const mongoose = require("mongoose");

const weekSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    description: {
      type: String,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);



weekSchema.pre(/^find/, function () {
  this.find({ active: true });
});

module.exports = mongoose.model("Week", weekSchema);
