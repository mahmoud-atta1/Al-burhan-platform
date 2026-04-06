const express = require("express");
const router = express.Router({ mergeParams: true });

const {
  getWeeks,
  getWeek,
  createWeek,
  updateWeek,
  deleteWeek,
  getWeekContent,
} = require("../services/week.service");

const {
  createWeekValidator,
  updateWeekValidator,
  getWeekValidator,
  deleteWeekValidator,
  getWeeksValidator,
} = require("../validators/week.validator");

const { protect, allowedTo } = require("../services/auth.service");
const { requireActiveEnrollment } = require("../middlewares/enrollment.middleware");

const lessonRoute = require("./lesson.routes");
const examRoute = require("./exam.routes");

router.use("/:weekId/lessons", lessonRoute);
router.use("/:weekId/exams", examRoute);

const setCourseIdToBody = (req, res, next) => {
  if (req.params.courseId && !req.body.course) {
    req.body.course = req.params.courseId;
  }
  next();
};

router.get("/:weekId/content", protect, requireActiveEnrollment, getWeekContent);

router.get("/", getWeeksValidator, getWeeks);
router.get("/:id", getWeekValidator, getWeek);

router.use(protect, allowedTo("admin"));

router.post("/", setCourseIdToBody, createWeekValidator, createWeek);
router.put("/:id", updateWeekValidator, updateWeek);
router.delete("/:id", deleteWeekValidator, deleteWeek);

module.exports = router;
