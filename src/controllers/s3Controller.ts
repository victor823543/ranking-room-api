import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Request, Response } from "express";
import {
  S3_ACCESS_KEY_ID,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from "../config.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

const client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

async function getPresignedUrl(req: Request, res: Response) {
  const { user } = res.locals;
  const { fileName } = req.query;
  const fileType =
    typeof req.query.fileType === "string" ? req.query.fileType : undefined;

  if (!fileName || !fileType) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: "images/" + `${user._id}/` + fileName,
    ContentType: fileType,
  };
  console.log(params);
  const command = new PutObjectCommand(params);
  const url = await getSignedUrl(client, command, { expiresIn: 60 });

  const fileUrl = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/images/${user._id}/${fileName}`;

  return sendValidResponse<{ signedUrl: string; fileUrl: string }>(
    res,
    SuccessCode.OK,
    { signedUrl: url, fileUrl },
  );
}

export default { getPresignedUrl };
