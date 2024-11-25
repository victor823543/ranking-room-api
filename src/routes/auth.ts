import express from "express";
import googleController from "../controllers/googleController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";

const router = express.Router();

router.post("/google-login", asyncHandler(googleController.googleLogin));

export default router;
