import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import {
  S3_ACCESS_KEY_ID,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from "../config.js";
import { Image } from "../models/Image.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

const client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

async function storeImage(req: Request, res: Response) {
  const { user } = res.locals;
  const { url } = req.body;
  if (!url) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  // Save image to database
  await Image.create({ url, user: user._id });

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function listImages(req: Request, res: Response) {
  const { user } = res.locals;

  const images = await Image.find({ user: user._id });
  const imageList = images.map((image) => ({
    id: image._id,
    url: image.url,
  }));
  return sendValidResponse(res, SuccessCode.OK, imageList);
}

async function deleteImage(req: Request, res: Response) {
  const { user } = res.locals;
  const { imageId } = req.params;

  const image = await Image.findOne({ _id: imageId, user: user._id });

  if (!image) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the image.");
  }

  await image.deleteOne();

  const fileName = image.url.split("/").pop(); // Assuming the URL contains the key at the end
  const deleteParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: "images/" + fileName,
  };

  try {
    await client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Failed to delete image from S3.",
    );
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

export default { storeImage, listImages, deleteImage };
