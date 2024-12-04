import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongodb from "mongoose";
import { MONGO_URI } from "./config.js";
import { errorHandler } from "./handlers/errorHandler.js";

import "./models/FriendRequest.js";
import "./models/Image.js";
import "./models/Object.js";
import "./models/Room.js";
import "./models/Template.js";
import "./models/User.js";

import authRoutes from "./routes/auth.js";
import friendRequestRoutes from "./routes/friendRequest.js";
import imageRoutes from "./routes/images.js";
import objectRoutes from "./routes/objects.js";
import roomRoutes from "./routes/rooms.js";
import s3Routes from "./routes/s3.js";
import templateRoutes from "./routes/templates.js";
import userRoutes from "./routes/users.js";

const server = express();

const port = 4000;

server.use(cors({ origin: "*" }));
server.use(bodyParser.json());

server.use("/api/users", userRoutes);
server.use("/api/friend-request", friendRequestRoutes);
server.use("/api/s3", s3Routes);
server.use("/api/images", imageRoutes);
server.use("/api/rooms", roomRoutes);
server.use("/api/objects", objectRoutes);
server.use("/api/auth", authRoutes);
server.use("/api/templates", templateRoutes);

server.use(errorHandler);

server.use("/api/health", (req, res) => {
  res.status(200).send("OK");
});

mongodb
  .connect(`${MONGO_URI}`)
  .then(() => {
    console.log("Successfully connected to mongodb.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

server.listen(port, async () => {
  console.log(`Listening on port: ${port}`);
});

export default server;
