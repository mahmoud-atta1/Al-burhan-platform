const express = require("express");

const router = express.Router({ mergeParams: true });

const { protect, allowedTo } = require("../services/auth.service");
const { requireActiveEnrollment } = require("../middlewares/enrollment.middleware");

const questionRouter = require("./question.routes");
const examAttemptRouter = require("./examAttempt.routes");

const {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
} = require("../services/exam.service");

const {
  getExamsValidator,
  createExamValidator,
  getExamValidator,
  updateExamValidator,
  deleteExamValidator,
} = require("../validators/exam.validator");

router.use("/:examId/questions", questionRouter);
router.use("/:examId/attempts", examAttemptRouter);

router.get(
  "/",
  protect,
  allowedTo("admin", "student"),
  requireActiveEnrollment,
  getExamsValidator,
  getExams,
);
router.get(
  "/:id",
  protect,
  allowedTo("admin", "student"),
  requireActiveEnrollment,
  getExamValidator,
  getExam,
);

router.use(protect);
router.use(allowedTo("admin"));

router.post("/", createExamValidator, createExam);
router.put("/:id", updateExamValidator, updateExam);
router.delete("/:id", deleteExamValidator, deleteExam);

module.exports = router;
