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

const buildAttemptReview = (questions, answers) => {
  const answersMap = new Map(
    (answers ?? []).map((answer) => [
      String(answer.questionId),
      answer.selectedOption,
    ]),
  );

  const incorrectQuestions = [];
  let unansweredCount = 0;

  for (const question of questions) {
    const questionId = String(question._id);

    const hasAnswer = answersMap.has(questionId);
    if (!hasAnswer) unansweredCount += 1;

    const selectedOption = hasAnswer ? answersMap.get(questionId) : null;
    const selectedOptionIsValid =
      typeof selectedOption === "number" &&
      selectedOption >= 0 &&
      selectedOption < (question.options?.length ?? 0);

    const studentAnswerText = selectedOptionIsValid
      ? question.options[selectedOption].text
      : null;

    const correctOptions = (question.options ?? [])
      .map((option, index) =>
        option.isCorrect ? { index, text: option.text } : null,
      )
      .filter(Boolean);

    const isCorrect =
      selectedOptionIsValid && question.options[selectedOption].isCorrect;

    if (isCorrect) continue;

    incorrectQuestions.push({
      questionId,
      questionText: question.questionText,
      mark: question.mark,
      studentAnswer: {
        selectedOption: selectedOptionIsValid ? selectedOption : null,
        text: studentAnswerText,
      },
      correctAnswer: {
        option: correctOptions[0] ?? null,
        options: correctOptions,
      },
    });
  }

  return {
    incorrectQuestions,
    incorrectCount: incorrectQuestions.length,
    unansweredCount,
    totalQuestions: questions.length,
  };
};

const serializeAttempt = (attempt, exam) => {
  const remainingSeconds =
    attempt.status === "in_progress" && attempt.expiresAt
      ? Math.max(
          0,
          Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000),
        )
      : 0;

  return {
    ...attempt.toObject(),
    examTotalMarks: exam?.totalMarks ?? 0,
    remainingSeconds,
  };
};

exports.startExamAttempt = asyncHandler(async (req, res) => {
  const exam = await getExamOrFail(req.params.examId);

  let attempt = await ExamAttempt.findOne({
    studentId: req.user._id,
    examId: exam._id,
  });

  if (attempt) {
    attempt = await syncExpiredAttempt(attempt);

    if (attempt.status !== "in_progress") {
      const questions = await Question.find({ examId: exam._id });
      const attemptData = serializeAttempt(attempt, exam);
      attemptData.review = buildAttemptReview(questions, attempt.answers);

      return res.status(200).json({
        success: true,
        message: "تم إنهاء هذه المحاولة بالفعل",
        data: attemptData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "المحاولة الحالية ما زالت نشطة",
      data: serializeAttempt(attempt, exam),
    });
  }

  ensureExamIsOpenNow(exam);

  const questionsCount = await Question.countDocuments({ examId: exam._id });
  if (!questionsCount) {
    throw new ApiError("لا يمكن بدء الامتحان قبل إضافة الأسئلة", 400);
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
    data: serializeAttempt(attempt, exam),
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

  const attemptData = serializeAttempt(attempt, exam);
  attemptData.review = buildAttemptReview(questions, attempt.answers);

  res.status(200).json({
    success: true,
    data: attemptData,
  });
});

exports.getMyExamAttempt = asyncHandler(async (req, res) => {
  const exam = await getExamOrFail(req.params.examId);

  let attempt = await ExamAttempt.findOne({
    studentId: req.user._id,
    examId: req.params.examId,
  });

  if (!attempt) {
    throw new ApiError("لا توجد محاولة لهذا الامتحان", 404);
  }

  attempt = await syncExpiredAttempt(attempt);

  const attemptData = serializeAttempt(attempt, exam);

  if (attempt.status !== "in_progress") {
    const questions = await Question.find({ examId: exam._id });
    attemptData.review = buildAttemptReview(questions, attempt.answers);
  }

  res.status(200).json({
    success: true,
    data: attemptData,
  });
});

exports.getExamAttempts = asyncHandler(async (req, res) => {
  const exam = await getExamOrFail(req.params.examId);

  const attempts = await ExamAttempt.find({
    examId: req.params.examId,
  }).populate("studentId", "fullName phone");

  res.status(200).json({
    success: true,
    results: attempts.length,
    examTotalMarks: exam.totalMarks ?? 0,
    data: attempts,
  });
});
