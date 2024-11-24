import express from "express";
import imageController from "../controllers/imageController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.post("/store", authorization, asyncHandler(imageController.storeImage));
router.get("/list", authorization, asyncHandler(imageController.listImages));
router.delete("/:id", authorization, asyncHandler(imageController.deleteImage));

export default router;
