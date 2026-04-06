const asyncHandler = require("express-async-handler");

const ExamAttempt = require("../models/examAttempt.model");
const Exam = require("../models/exam.model");
const Question = require("../models/question.model");
const ApiError = require("../utils/apiError");


const getExamOrFail = async (examId) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new ApiError("الامتحان غير موجود", 404);
  return exam;
};

const ensureExamIsOpenNow = (exam) => {
  const now = new Date();

  if (!exam.isPublished) {
    throw new ApiError("الامتحان غير متاح حالياً", 400);
  }

  if (exam.availableFrom && now < exam.availableFrom) {
    throw new ApiError("لم يبدأ الامتحان بعد", 400);
  }

  if (exam.availableUntil && now > exam.availableUntil) {
    throw new ApiError("انتهت مدة إتاحة الامتحان", 400);
  }
};

const syncExpiredAttempt = async (attempt) => {
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

const calculateAttemptScore = (questions, answers) => {
  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  let score = 0;

  for (const answer of answers) {
    const question = questionMap.get(String(answer.questionId));
    if (!question) {
      throw new ApiError("سؤال غير تابع للامتحان", 400);
    }

    if (
      answer.selectedOption < 0 ||
      answer.selectedOption >= question.options.length
    ) {
      throw new ApiError("اختيار غير صالح", 400);
    }

    if (question.options[answer.selectedOption].isCorrect) {
      score += question.mark;
    }
  }

  return score;
};

const serializeAttempt = (attempt) => {
  const remainingSeconds =
    attempt.status === "in_progress" && attempt.expiresAt
      ? Math.max(
          0,
          Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000),
        )
      : 0;

  return {
    ...attempt.toObject(),
    remainingSeconds,
  };
};

exports.startExamAttempt = asyncHandler(async (req, res) => {
  const exam = await getExamOrFail(req.params.examId);
  ensureExamIsOpenNow(exam);

  const questionsCount = await Question.countDocuments({ examId: exam._id });
  if (!questionsCount) {
    throw new ApiError("لا يمكن بدء الامتحان قبل إضافة الأسئلة", 400);
  }

  let attempt = await ExamAttempt.findOne({
    studentId: req.user._id,
    examId: exam._id,
  });

  if (attempt) {
    attempt = await syncExpiredAttempt(attempt);

    if (attempt.status !== "in_progress") {
      throw new ApiError("تم حل الامتحان بالفعل", 400);
    }

    return res.status(200).json({
      success: true,
      message: "المحاولة الحالية ما زالت نشطة",
      data: serializeAttempt(attempt),
    });
  }

  const startedAt = new Date();
  const attemptExpiresAt = new Date(
    startedAt.getTime() + exam.duration * 60 * 1000,
  );
  const expiresAt =
    exam.availableUntil && exam.availableUntil < attemptExpiresAt
      ? exam.availableUntil
      : attemptExpiresAt;

  attempt = await ExamAttempt.create({
    studentId: req.user._id,
    examId: exam._id,
    score: 0,
    answers: [],
    status: "in_progress",
    startedAt,
    expiresAt,
  });

  res.status(201).json({
    success: true,
    data: serializeAttempt(attempt),
  });
});

exports.submitExamAttempt = asyncHandler(async (req, res) => {
  const exam = await getExamOrFail(req.params.examId);

  let attempt = await ExamAttempt.findOne({
    studentId: req.user._id,
    examId: exam._id,
  });

  if (!attempt) {
    throw new ApiError("يجب بدء الامتحان أولاً", 400);
  }

  attempt = await syncExpiredAttempt(attempt);

  if (attempt.status !== "in_progress") {
    throw new ApiError("انتهت هذه المحاولة بالفعل", 400);
  }

  const questions = await Question.find({ examId: exam._id });
  if (!questions.length) {
    throw new ApiError("لا يوجد أسئلة لهذا الامتحان", 400);
  }

  const score = calculateAttemptScore(questions, req.body.answers);

  attempt.answers = req.body.answers;
  attempt.score = score;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  await attempt.save();

  res.status(200).json({
    success: true,
    data: serializeAttempt(attempt),
  });
});

exports.getMyExamAttempt = asyncHandler(async (req, res) => {
  await getExamOrFail(req.params.examId);

  let attempt = await ExamAttempt.findOne({
    studentId: req.user._id,
    examId: req.params.examId,
  });

  if (!attempt) {
    throw new ApiError("لا توجد محاولة لهذا الامتحان", 404);
  }

  attempt = await syncExpiredAttempt(attempt);

  res.status(200).json({
    success: true,
    data: serializeAttempt(attempt),
  });
});

exports.getExamAttempts = asyncHandler(async (req, res) => {
  await getExamOrFail(req.params.examId);

  const attempts = await ExamAttempt.find({
    examId: req.params.examId,
  }).populate("studentId", "fullName phone");

  res.status(200).json({
    success: true,
    results: attempts.length,
    data: attempts,
  });
});
