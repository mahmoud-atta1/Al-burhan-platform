const asyncHandler = require("express-async-handler");
const Lesson = require("../models/lesson.model");
const Week = require("../models/week.model");
const ApiError = require("../utils/apiError");

const validateWeek = async (weekId, next) => {
  const week = await Week.findById(weekId);
  if (!week) return next(new ApiError("الأسبوع غير موجود", 404));
  return week;
};

exports.createLesson = asyncHandler(async (req, res, next) => {
  await validateWeek(req.params.weekId, next);

  const existingOrder = await Lesson.findOne({
    weekId: req.params.weekId,
    order: req.body.order,
  });

  if (existingOrder)
    return next(new ApiError("ترتيب الحصة موجود بالفعل في هذا الأسبوع", 400));

  const lesson = await Lesson.create(req.body);

  res.status(201).json({
    success: true,
    data: lesson,
  });
});

exports.getWeekLessons = asyncHandler(async (req, res, next) => {
  const week = await validateWeek(req.params.weekId, next);
  if (!week) return;

  const lessons = await Lesson.find({
    weekId: req.params.weekId,
    isPublished: true,
  }).sort({ order: 1 });

  res.status(200).json({
    success: true,
    results: lessons.length,
    data: lessons,
  });
});

exports.getLesson = asyncHandler(async (req, res, next) => {
  const week = await validateWeek(req.params.weekId, next);
  if (!week) return;

  const lesson = await Lesson.findOne({
    _id: req.params.id,
    weekId: req.params.weekId,
    isPublished: true,
  });

  if (!lesson)
    return next(new ApiError("الحصة غير موجودة في هذا الأسبوع", 404));

  res.status(200).json({
    success: true,
    data: lesson,
  });
});

exports.updateLesson = asyncHandler(async (req, res, next) => {
  await validateWeek(req.params.weekId, next);

  delete req.body.weekId;
  delete req.body.active;

  if (req.body.order) {
    const existingOrder = await Lesson.findOne({
      weekId: req.params.weekId,
      order: req.body.order,
      _id: { $ne: req.params.id },
    });

    if (existingOrder)
      return next(new ApiError("الترتيب الجديد مستخدم بالفعل", 400));
  }

  const lesson = await Lesson.findOneAndUpdate(
    { _id: req.params.id, weekId: req.params.weekId },
    req.body,
    { new: true, runValidators: true },
  );

  if (!lesson) return next(new ApiError("الحصة غير موجودة", 404));

  res.status(200).json({
    success: true,
    data: lesson,
  });
});

exports.deleteLesson = asyncHandler(async (req, res, next) => {
  await validateWeek(req.params.weekId, next);

  const lesson = await Lesson.findOneAndUpdate(
    { _id: req.params.id, weekId: req.params.weekId },
    { isPublished: false, active: false },
    { new: true },
  );

  if (!lesson) return next(new ApiError("الحصة غير موجودة", 404));

  res.status(200).json({
    success: true,
    message: "تم حذف الحصة بنجاح",
  });
});
