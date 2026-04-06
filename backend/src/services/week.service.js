const asyncHandler = require("express-async-handler");

const Week = require("../models/week.model");
const Course = require("../models/course.model");
const Lesson = require("../models/lesson.model");
const Exam = require("../models/exam.model");
const ApiError = require("../utils/apiError");

const checkCourseOwnership = async (req) => {
  const courseId = req.params.courseId || req.body.course;
  if (!courseId) return null;

  const filter = { _id: courseId };
  if (req.params.trackId) filter.track = req.params.trackId;

  return await Course.findOne(filter);
};

exports.getWeekContent = asyncHandler(async (req, res, next) => {
  const { weekId } = req.params;

  const week = await Week.findById(weekId);
  if (!week) return next(new ApiError("الأسبوع غير موجود", 404));

  const [lessons, exams] = await Promise.all([
    Lesson.find({ weekId: weekId }).sort("order"),
    Exam.find({ weekId: weekId }).sort("order"),
  ]);

  res.status(200).json({
    success: true,
    data: {
      week,
      lessons,
      exams,
    },
  });
});

exports.getWeeks = asyncHandler(async (req, res, next) => {
  let filter = {};
  if (req.params.courseId) {
    const course = await checkCourseOwnership(req);
    if (!course)
      return next(
        new ApiError("الكورس غير موجود أو لا ينتمي لهذا المسار", 404),
      );
    filter.course = course._id;
  }

  const weeks = await Week.find(filter).sort("order");
  res.status(200).json({ success: true, results: weeks.length, data: weeks });
});

exports.getWeek = asyncHandler(async (req, res, next) => {
  const filter = { _id: req.params.id };
  if (req.params.courseId) filter.course = req.params.courseId;

  const week = await Week.findOne(filter);
  if (!week) return next(new ApiError("الأسبوع غير موجود", 404));

  res.status(200).json({ success: true, data: week });
});

exports.createWeek = asyncHandler(async (req, res, next) => {
  if (req.params.courseId) req.body.course = req.params.courseId;
  if (!req.body.course) return next(new ApiError("الكورس مطلوب", 400));

  const course = await checkCourseOwnership(req);
  if (!course) return next(new ApiError("الكورس غير موجود", 404));

  const week = await Week.create(req.body);
  res.status(201).json({ success: true, data: week });
});

exports.updateWeek = asyncHandler(async (req, res, next) => {
  delete req.body.course;

  const filter = { _id: req.params.id };
  if (req.params.courseId) filter.course = req.params.courseId;

  const week = await Week.findOneAndUpdate(filter, req.body, {
    new: true,
    runValidators: true,
  });

  if (!week) return next(new ApiError("الأسبوع غير موجود", 404));
  res.status(200).json({ success: true, data: week });
});

exports.deleteWeek = asyncHandler(async (req, res, next) => {
  const filter = { _id: req.params.id };
  if (req.params.courseId) filter.course = req.params.courseId;

  const week = await Week.findOneAndUpdate(
    filter,
    { active: false },
    { new: true },
  );

  if (!week) return next(new ApiError("الأسبوع غير موجود", 404));
  res.status(200).json({ success: true, message: "تم حذف الأسبوع بنجاح" });
});
