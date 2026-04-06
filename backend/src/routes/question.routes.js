const express = require("express");

const router = express.Router({ mergeParams: true });

const { protect, allowedTo } = require("../services/auth.service");
const { requireActiveEnrollment } = require("../middlewares/enrollment.middleware");

const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../services/question.service");

const {
  getQuestionsValidator,
  createQuestionValidator,
  getQuestionValidator,
  updateQuestionValidator,
  deleteQuestionValidator,
} = require("../validators/question.validator");

router.use(protect);

router.get(
  "/",
  allowedTo("admin", "student"),
  requireActiveEnrollment,
  getQuestionsValidator,
  getQuestions,
);
router.get(
  "/:id",
  allowedTo("admin", "student"),
  requireActiveEnrollment,
  getQuestionValidator,
  getQuestion,
);

router.use(allowedTo("admin"));

router.post("/", createQuestionValidator, createQuestion);
router.put("/:id", updateQuestionValidator, updateQuestion);
router.delete("/:id", deleteQuestionValidator, deleteQuestion);

module.exports = router;
