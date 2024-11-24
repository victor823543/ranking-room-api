import express from "express";
import roomController from "../controllers/roomController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.post("/create", authorization, asyncHandler(roomController.createRoom));
router.get("/list", authorization, asyncHandler(roomController.listUserRooms));
router.get("/:id", authorization, asyncHandler(roomController.getRoomById));

export default router;
