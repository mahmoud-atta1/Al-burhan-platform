const asyncHandler = require("express-async-handler");

const Enrollment = require("../models/enrollment.model");
const Course = require("../models/course.model");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");

const getCourseOrFail = async (courseId, next) => {
  const course = await Course.findById(courseId).select("title price isPublished");
  if (!course) {
    return next(new ApiError("الكورس غير موجود", 404));
  }
  if (!course.isPublished) {
    return next(new ApiError("الكورس غير متاح حالياً", 403));
  }
  return course;
};

const getStudentOrFail = async (studentId, next) => {
  const student = await User.findById(studentId).select("role active fullName phone");
  if (!student) {
    return next(new ApiError("الطالب غير موجود", 404));
  }
  if (student.role !== "student") {
    return next(new ApiError("يمكن إضافة الكورس للطلاب فقط", 400));
  }
  if (!student.active) {
    return next(new ApiError("حساب الطالب غير مفعل", 400));
  }
  return student;
};

exports.requestEnrollment = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const course = await getCourseOrFail(courseId, next);
  if (!course) return;

  const isPaidCourse = course.price > 0;
  const uploadedPaymentScreenshot = isPaidCourse
    ? req.body.paymentScreenshot
    : null;
  const requestedStatus = isPaidCourse ? "pending" : "active";
  const existing = await Enrollment.findOne({
    studentId: req.user._id,
    courseId,
  });

  if (existing && existing.status === "active") {
    return next(new ApiError("أنت مشترك بالفعل في هذا الكورس", 400));
  }

  if (isPaidCourse && req.file && !req.file.mimetype.startsWith("image/")) {
    return next(new ApiError("يرجى رفع صورة إثبات الدفع بصيغة JPG أو PNG", 400));
  }

  if (isPaidCourse && !uploadedPaymentScreenshot && !existing?.paymentScreenshot) {
    return next(new ApiError("يرجى رفع صورة إثبات الدفع قبل إرسال الطلب", 400));
  }

  if (existing && existing.status === "pending") {
    if (
      uploadedPaymentScreenshot &&
      uploadedPaymentScreenshot !== existing.paymentScreenshot
    ) {
      existing.paymentScreenshot = uploadedPaymentScreenshot;
      existing.requestedAt = new Date();
      await existing.save();

      return res.status(200).json({
        success: true,
        message: "تم تحديث صورة إثبات الدفع والطلب ما زال قيد المراجعة",
        data: existing,
      });
    }

    return res.status(200).json({
      success: true,
      message: "طلب الاشتراك قيد المراجعة بالفعل",
      data: existing,
    });
  }

  const payload = {
    status: requestedStatus,
    requestedAt: new Date(),
  };

  if (requestedStatus === "pending") {
    payload.paymentScreenshot =
      uploadedPaymentScreenshot || existing?.paymentScreenshot;
  }

  if (requestedStatus === "active") {
    payload.enrolledAt = new Date();
  }

  let enrollment;
  if (existing) {
    enrollment = await Enrollment.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    enrollment = await Enrollment.create({
      studentId: req.user._id,
      courseId,
      ...payload,
    });
  }

  res.status(201).json({
    success: true,
    message:
      requestedStatus === "active"
        ? "تم تفعيل الاشتراك تلقائيًا لأن الكورس مجاني"
        : "تم إرسال طلب الاشتراك بنجاح",
    data: enrollment,
  });
});

exports.getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ studentId: req.user._id })
    .populate("courseId", "title price isPublished")
    .sort("-updatedAt");

  res.status(200).json({
    success: true,
    results: enrollments.length,
    data: enrollments,
  });
});

exports.getEnrollments = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.courseId) filter.courseId = req.query.courseId;

  const enrollments = await Enrollment.find(filter)
    .populate("studentId", "fullName phone email")
    .populate("courseId", "title price isPublished")
    .populate("approvedBy", "fullName")
    .sort("-updatedAt");

  res.status(200).json({
    success: true,
    results: enrollments.length,
    data: enrollments,
  });
});

exports.approveEnrollment = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return next(new ApiError("الاشتراك غير موجود", 404));
  }

  if (enrollment.status === "active") {
    return res.status(200).json({
      success: true,
      message: "الاشتراك مفعل بالفعل",
      data: enrollment,
    });
  }

  enrollment.status = "active";
  enrollment.enrolledAt = new Date();
  enrollment.approvedBy = req.user._id;
  await enrollment.save();

  res.status(200).json({
    success: true,
    message: "تم تفعيل الاشتراك بنجاح",
    data: enrollment,
  });
});

exports.cancelEnrollment = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) {
    return next(new ApiError("الاشتراك غير موجود", 404));
  }

  if (enrollment.status === "canceled") {
    return res.status(200).json({
      success: true,
      message: "الاشتراك ملغي بالفعل",
      data: enrollment,
    });
  }

  enrollment.status = "canceled";
  enrollment.approvedBy = req.user._id;
  await enrollment.save();

  res.status(200).json({
    success: true,
    message: "تم إلغاء الاشتراك",
    data: enrollment,
  });
});

exports.manualAssignEnrollment = asyncHandler(async (req, res, next) => {
  const { studentId, courseId } = req.body;

  const student = await getStudentOrFail(studentId, next);
  if (!student) return;

  const course = await getCourseOrFail(courseId, next);
  if (!course) return;

  let enrollment = await Enrollment.findOne({ studentId, courseId });

  if (!enrollment) {
    enrollment = await Enrollment.create({
      studentId,
      courseId,
      status: "active",
      requestedAt: new Date(),
      enrolledAt: new Date(),
      approvedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "تم إضافة الكورس للطالب وتفعيل الاشتراك",
      data: enrollment,
    });
  }

  if (enrollment.status !== "active") {
    enrollment.status = "active";
    enrollment.enrolledAt = new Date();
  }

  enrollment.approvedBy = req.user._id;
  await enrollment.save();

  res.status(200).json({
    success: true,
    message: "تم تفعيل اشتراك الطالب على الكورس",
    data: enrollment,
  });
});
