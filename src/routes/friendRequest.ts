import express from "express";
import friendRequestController from "../controllers/friendRequestController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.post(
  "/:friendId",
  authorization,
  asyncHandler(friendRequestController.sendFriendRequest),
);
router.patch(
  "/respond/:requestId",
  authorization,
  asyncHandler(friendRequestController.respondToFriendRequest),
);
router.get(
  "/list",
  authorization,
  asyncHandler(friendRequestController.listFriendRequests),
);

export default router;
