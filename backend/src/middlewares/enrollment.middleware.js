const asyncHandler = require("express-async-handler");

const Course = require("../models/course.model");
const Week = require("../models/week.model");
const Exam = require("../models/exam.model");
const Enrollment = require("../models/enrollment.model");
const ApiError = require("../utils/apiError");

const resolveCourseIdFromRequest = async (req) => {
  if (req.params.courseId) return req.params.courseId;

  if (req.params.weekId) {
    const week = await Week.findById(req.params.weekId).select("course");
    if (!week) throw new ApiError("الأسبوع غير موجود", 404);
    return week.course.toString();
  }

  if (req.params.examId) {
    const exam = await Exam.findById(req.params.examId).select("courseId");
    if (!exam) throw new ApiError("الامتحان غير موجود", 404);
    return exam.courseId.toString();
  }

  if (req.baseUrl.includes("/exams") && req.params.id) {
    const exam = await Exam.findById(req.params.id).select("courseId");
    if (!exam) throw new ApiError("الامتحان غير موجود", 404);
    return exam.courseId.toString();
  }

  return null;
};

exports.requireActiveEnrollment = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new ApiError("يرجى تسجيل الدخول أولاً", 401));
  }

  if (req.user.role === "admin") return next();

  const courseId = await resolveCourseIdFromRequest(req);
  if (!courseId) {
    return next(new ApiError("تعذر تحديد الكورس المطلوب للتحقق من الاشتراك", 400));
  }

  const course = await Course.findById(courseId).select("price isPublished");
  if (!course) {
    return next(new ApiError("الكورس غير موجود", 404));
  }

  if (!course.isPublished) {
    return next(new ApiError("الكورس غير متاح حالياً", 403));
  }

  if (course.price <= 0) {
    req.course = course;
    return next();
  }

  const enrollment = await Enrollment.findOne({
    studentId: req.user._id,
    courseId,
    status: "active",
  }).select("_id status enrolledAt expiresAt");

  if (!enrollment) {
    return next(new ApiError("يجب الاشتراك في الكورس أولاً", 403));
  }

  if (enrollment.expiresAt && enrollment.expiresAt <= new Date()) {
    enrollment.status = "expired";
    await enrollment.save();
    return next(new ApiError("انتهت صلاحية الاشتراك لهذا الكورس", 403));
  }

  req.course = course;
  req.enrollment = enrollment;
  next();
});
