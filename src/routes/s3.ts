import express from "express";
import s3Controller from "../controllers/s3Controller.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.get(
  "/presigned-url",
  authorization,
  asyncHandler(s3Controller.getPresignedUrl),
);

export default router;
