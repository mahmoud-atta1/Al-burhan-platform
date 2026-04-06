const express = require("express");

const router = express.Router({ mergeParams: true });

const { protect, allowedTo } = require("../services/auth.service");
const { requireActiveEnrollment } = require("../middlewares/enrollment.middleware");

const {
  startExamAttempt,
  submitExamAttempt,
  getMyExamAttempt,
  getExamAttempts,
} = require("../services/examAttempt.service");

const {
  startExamAttemptValidator,
  submitExamAttemptValidator,
  getMyExamAttemptValidator,
  getExamAttemptsValidator,
} = require("../validators/examAttempt.validator");

router.use(protect);

router.get(
  "/my",
  allowedTo("student"),
  requireActiveEnrollment,
  getMyExamAttemptValidator,
  getMyExamAttempt,
);

router.post(
  "/start",
  allowedTo("student"),
  requireActiveEnrollment,
  startExamAttemptValidator,
  startExamAttempt,
);

router.post(
  "/submit",
  allowedTo("student"),
  requireActiveEnrollment,
  submitExamAttemptValidator,
  submitExamAttempt,
);

router.get(
  "/",
  allowedTo("admin"),
  getExamAttemptsValidator,
  getExamAttempts,
);

module.exports = router;
