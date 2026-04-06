const express = require("express");

const router = express.Router();

const { protect, allowedTo } = require("../services/auth.service");
const { uploadSingle, resizeImage } = require("../middlewares/uploadMiddleware");
const {
  requestEnrollment,
  getMyEnrollments,
  getEnrollments,
  approveEnrollment,
  cancelEnrollment,
  manualAssignEnrollment,
} = require("../services/enrollment.service");
const {
  requestEnrollmentValidator,
  manualAssignEnrollmentValidator,
  approveEnrollmentValidator,
  cancelEnrollmentValidator,
  getEnrollmentsValidator,
} = require("../validators/enrollment.validator");

router.use(protect);

router.post(
  "/courses/:courseId/request",
  allowedTo("student"),
  uploadSingle("paymentScreenshot"),
  resizeImage("payment-proofs", 1400, 1400, "paymentScreenshot"),
  requestEnrollmentValidator,
  requestEnrollment,
);

router.get("/me", allowedTo("student"), getMyEnrollments);

router.use(allowedTo("admin"));

router.get("/", getEnrollmentsValidator, getEnrollments);
router.post(
  "/manual-assign",
  manualAssignEnrollmentValidator,
  manualAssignEnrollment,
);
router.patch("/:id/approve", approveEnrollmentValidator, approveEnrollment);
router.patch("/:id/cancel", cancelEnrollmentValidator, cancelEnrollment);

module.exports = router;
