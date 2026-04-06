const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: true,
    },

    durationInWeeks: {
      type: Number,
      min: 1,
    },

    coverImage: String,

    isPublished: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

courseSchema.pre(/^find/, function () {
  this.find({ active: true });
});

courseSchema.virtual("coverImageUrl").get(function () {
  return `${process.env.BASE_URL}${this.coverImage}`;
});

courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });
module.exports = mongoose.model("Course", courseSchema);
