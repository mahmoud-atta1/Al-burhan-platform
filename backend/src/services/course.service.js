const asyncHandler = require("express-async-handler");
const Course = require("../models/course.model");
const Track = require("../models/track.model");
const ApiError = require("../utils/apiError");

exports.createCourse = asyncHandler(async (req, res, next) => {
  const track = await Track.findById(req.body.track);
  if (!track) return next(new ApiError("المسار غير موجود", 404));

  const course = await Course.create(req.body);
  res.status(201).json({ success: true, data: course });
});

exports.getCourses = asyncHandler(async (req, res) => {
  let filter = { isPublished: true };

  if (req.params.trackId) filter.track = req.params.trackId;

  const courses = await Course.find(filter).populate("track", "name");
  res.status(200).json({
    success: true,
    results: courses.length,
    data: courses,
  });
});

exports.getCourse = asyncHandler(async (req, res, next) => {
  const filter = { _id: req.params.id, isPublished: true };
  if (req.params.trackId) filter.track = req.params.trackId;

  const course = await Course.findOne(filter).populate("track", "name");
  if (!course) return next(new ApiError("الكورس غير موجود", 404));

  res.status(200).json({ success: true, data: course });
});

exports.updateCourse = asyncHandler(async (req, res, next) => {
  const filter = { _id: req.params.id };
  if (req.params.trackId) filter.track = req.params.trackId;

  const course = await Course.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  });

  if (!course)
    return next(new ApiError("الكورس غير موجود أو لا ينتمي لهذا المسار", 404));
  res.status(200).json({ success: true, data: course });
});

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const filter = { _id: req.params.id };
  if (req.params.trackId) filter.track = req.params.trackId;

  const course = await Course.findOneAndUpdate(
    filter,
    { active: false },
    { new: true },
  );

  if (!course) return next(new ApiError("الكورس غير موجود", 404));
  res.status(200).json({ success: true, message: "تم حذف الكورس بنجاح" });
});
