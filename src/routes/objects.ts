import express from "express";
import objectController from "../controllers/objectController.js";
import { asyncHandler } from "../handlers/asyncHandler.js";
import authorization from "../middleware/authorization.js";

const router = express.Router();

router.put(
  "/rank/:roomId",
  authorization,
  asyncHandler(objectController.rankObjects),
);
router.put(
  "/add/:roomId",
  authorization,
  asyncHandler(objectController.addObjectsToRoom),
);
router.put(
  "/update/:objectId",
  authorization,
  asyncHandler(objectController.updateObject),
);

export default router;
