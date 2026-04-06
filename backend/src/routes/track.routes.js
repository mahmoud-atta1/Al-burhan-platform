const express = require("express");
const router = express.Router();

const { protect, allowedTo } = require("../services/auth.service");

const {
  uploadSingle,
  resizeImage,
} = require("../middlewares/uploadMiddleware");

const {
  createTrack,
  getTracks,
  getTrack,
  updateTrack,
  deleteTrack,
} = require("../services/track.service");

const {
  getTrackValidator,
  createTrackValidator,
  updateTrackValidator,
  deleteTrackValidator,
} = require("../validators/track.validator");

const courseRouter = require("./course.routes");

router.use("/:trackId/courses", courseRouter);

router.get("/", getTracks);
router.get("/:id", getTrackValidator, getTrack);

router.use(protect);
router.use(allowedTo("admin"));

router.post(
  "/",
  uploadSingle("coverImage"),
  resizeImage("tracks", 800, 450),
  createTrackValidator,
  createTrack,
);

router.put(
  "/:id",
  uploadSingle("coverImage"),
  resizeImage("tracks", 800, 450),
  updateTrackValidator,
  updateTrack,
);

router.delete("/:id", deleteTrackValidator, deleteTrack);

module.exports = router;
