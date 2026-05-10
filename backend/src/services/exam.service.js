const asyncHandler = require("express-async-handler");

const Exam = require("../models/exam.model");
const Week = require("../models/week.model");
const Question = require("../models/question.model");
const ExamAttempt = require("../models/examAttempt.model");
const ApiError = require("../utils/apiError");
const {
  calculateExamTotalMarks,
  calculateExamsTotalMarks,
} = require("../utils/examTotalMarks");

const getWeekOrFail = async (weekId, next) => {
  const week = await Week.findById(weekId);
  if (!week) {
    return next(new ApiError("الأسبوع غير موجود", 404));
  }
  return week;
};

exports.createExam = asyncHandler(async (req, res, next) => {
  const week = await getWeekOrFail(req.params.weekId, next);

  const exists = await Exam.findOne({
    weekId: week._id,
    title: req.body.title,
  });

  if (exists) {
    return next(
      new ApiError("عنوان الامتحان مستخدم بالفعل في هذا الأسبوع", 400),
    );
  }

  const payload = { ...req.body };
  delete payload.totalMarks;

  const exam = await Exam.create({
    ...payload,
    totalMarks: 0,
    weekId: week._id,
    courseId: week.course,
  });

  res.status(201).json({
    success: true,
    data: exam,
  });
});

exports.getExams = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.params.weekId) {
    filter.weekId = req.params.weekId;
  }

  if (req.params.courseId) {
    filter.courseId = req.params.courseId;
  }

  const exams = await Exam.find(filter).sort("-createdAt");

  const totalsMap = await calculateExamsTotalMarks(exams.map((e) => e._id));
  const updates = [];

  for (const exam of exams) {
    const computedTotal = totalsMap.get(exam._id.toString()) ?? 0;

    if (exam.totalMarks !== computedTotal) {
      exam.totalMarks = computedTotal;
      updates.push({
        updateOne: {
          filter: { _id: exam._id },
          update: { $set: { totalMarks: computedTotal } },
        },
      });
    }
  }

  if (updates.length) {
    await Exam.bulkWrite(updates);
  }

  res.status(200).json({
    success: true,
    results: exams.length,
    data: exams,
  });
});

exports.getExam = asyncHandler(async (req, res, next) => {
  const exam = await Exam.findOne({ _id: req.params.id });

  if (!exam) {
    return next(new ApiError("الامتحان غير موجود", 404));
  }

  const computedTotal = await calculateExamTotalMarks(exam._id);

  if (exam.totalMarks !== computedTotal) {
    exam.totalMarks = computedTotal;
    await Exam.updateOne(
      { _id: exam._id },
      { $set: { totalMarks: computedTotal } },
    );
  }

  res.status(200).json({
    success: true,
    data: exam,
  });
});

exports.updateExam = asyncHandler(async (req, res, next) => {
  delete req.body.weekId;
  delete req.body.courseId;
  delete req.body.totalMarks;

  const exam = await Exam.findOne({
    _id: req.params.id,
  });

  if (!exam) {
    return next(new ApiError("الامتحان غير موجود", 404));
  }

  if (req.body.title) {
    const exists = await Exam.findOne({
      weekId: exam.weekId,
      title: req.body.title,
      _id: { $ne: exam._id },
    });

    if (exists) {
      return next(new ApiError("عنوان الامتحان مستخدم بالفعل", 400));
    }
  }

  const updatedExam = await Exam.findByIdAndUpdate(exam._id, req.body, {
    new: true,
    runValidators: true,
  });

  const computedTotal = await calculateExamTotalMarks(updatedExam._id);

  if (updatedExam.totalMarks !== computedTotal) {
    updatedExam.totalMarks = computedTotal;
    await Exam.updateOne(
      { _id: updatedExam._id },
      { $set: { totalMarks: computedTotal } },
    );
  }

  res.status(200).json({
    success: true,
    data: updatedExam,
  });
});

exports.deleteExam = asyncHandler(async (req, res, next) => {
  const exam = await Exam.findOne({
    _id: req.params.id,
  });

  if (!exam) {
    return next(new ApiError("الامتحان غير موجود", 404));
  }

  await Promise.all([
    Question.deleteMany({ examId: exam._id }),
    ExamAttempt.deleteMany({ examId: exam._id }),
    Exam.findByIdAndDelete(exam._id),
  ]);

  res.status(200).json({
    success: true,
    message: "تم حذف الامتحان بنجاح",
  });
});
