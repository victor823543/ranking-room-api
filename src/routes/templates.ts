import express from "express";
import templateController from "../controllers/templateController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(templateController.getTemplates));

export default router;
