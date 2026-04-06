const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
    educationLevel: {
      type: String,
      enum: ["1st_secondary", "2nd_secondary", "3rd_secondary"],
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

trackSchema.pre(/^find/, function () {
  this.find({ active: true });
});

trackSchema.virtual("coverImageUrl").get(function () {
  return `${process.env.BASE_URL}${this.coverImage}`;
});

trackSchema.set("toJSON", { virtuals: true });
trackSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Track", trackSchema);
