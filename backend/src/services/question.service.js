const asyncHandler = require("express-async-handler");

const Question = require("../models/question.model");
const Exam = require("../models/exam.model");
const ExamAttempt = require("../models/examAttempt.model");
const ApiError = require("../utils/apiError");

const getExamOrFail = async (examId) => {
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new ApiError("الامتحان غير موجود", 404);
  }

  return exam;
};

const getActiveAttempt = async (examId, studentId) => {
  const attempt = await ExamAttempt.findOne({
    examId,
    studentId,
  });

  if (
    attempt &&
    attempt.status === "in_progress" &&
    attempt.expiresAt &&
    attempt.expiresAt <= new Date()
  ) {
    attempt.status = "auto_submitted";
    attempt.submittedAt = attempt.expiresAt;
    await attempt.save();
  }

  return attempt;
};

exports.createQuestion = asyncHandler(async (req, res, next) => {
  const exam = await getExamOrFail(req.params.examId, next);

  const exists = await Question.findOne({
    examId: exam._id,
    questionText: req.body.questionText,
  });

  if (exists) {
    return next(new ApiError("السؤال موجود بالفعل", 400));
  }

  const question = await Question.create({
    ...req.body,
    examId: exam._id,
  });

  res.status(201).json({
    success: true,
    data: question,
  });
});

exports.getQuestions = asyncHandler(async (req, res, next) => {
  const exam = await getExamOrFail(req.params.examId, next);
  if (!exam) return;

  if (req.user.role === "student") {
    const attempt = await getActiveAttempt(exam._id, req.user._id);
    if (!attempt || attempt.status !== "in_progress") {
      return next(
        new ApiError("يجب بدء الامتحان أولاً للوصول إلى الأسئلة", 400),
      );
    }
  }

  const questions = await Question.find({
    examId: req.params.examId,
  });

  const data =
    req.user.role === "student"
      ? questions.map((q) => ({
          ...q.toObject(),
          options: q.options.map((o) => ({ text: o.text })),
        }))
      : questions;

  res.status(200).json({
    success: true,
    results: questions.length,
    data,
  });
});

exports.getQuestion = asyncHandler(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new ApiError("السؤال غير موجود", 404));
  }

  const exam = await getExamOrFail(question.examId, next);
  if (!exam) return;

  if (req.user.role === "student") {
    const attempt = await getActiveAttempt(exam._id, req.user._id);
    if (!attempt || attempt.status !== "in_progress") {
      return next(
        new ApiError("يجب بدء الامتحان أولاً للوصول إلى السؤال", 400),
      );
    }
  }

  const data =
    req.user.role === "student"
      ? {
          ...question.toObject(),
          options: question.options.map((o) => ({ text: o.text })),
        }
      : question;

  res.status(200).json({
    success: true,
    data,
  });
});

exports.updateQuestion = asyncHandler(async (req, res, next) => {
  delete req.body.examId;

  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new ApiError("السؤال غير موجود", 404));
  }

  if (req.body.questionText) {
    const exists = await Question.findOne({
      examId: question.examId,
      questionText: req.body.questionText,
      _id: { $ne: question._id },
    });

    if (exists) {
      return next(new ApiError("السؤال موجود بالفعل", 400));
    }
  }

  const updated = await Question.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
});

exports.deleteQuestion = asyncHandler(async (req, res, next) => {
  const question = await Question.findByIdAndDelete(req.params.id);

  if (!question) {
    return next(new ApiError("السؤال غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    message: "تم حذف السؤال بنجاح",
  });
});
