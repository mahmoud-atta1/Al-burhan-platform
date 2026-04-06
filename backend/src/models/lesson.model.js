const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    weekId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Week",
      required: true,
    },
    type: {
      type: String,
      enum: ["video", "pdf", "exam", "assignment"],
      required: true,
    },
    contentUrl: {
      type: String,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

lessonSchema.index({ weekId: 1, order: 1 }, { unique: true });

lessonSchema.virtual("fullContentUrl").get(function () {
  if (this.contentUrl) {
    if (this.contentUrl.startsWith("http")) {
      return this.contentUrl;
    }
    return `${process.env.BASE_URL}${this.contentUrl}`;
  }
  return null;
});

lessonSchema.set("toJSON", { virtuals: true });
lessonSchema.set("toObject", { virtuals: true });

lessonSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

module.exports = mongoose.model("Lesson", lessonSchema);
