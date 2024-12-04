import { Request, Response } from "express";
import { ITemplate, Template } from "../models/Template.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

async function getTemplates(req: Request, res: Response) {
  try {
    const templates = await Template.find();
    return sendValidResponse<ITemplate[]>(res, SuccessCode.OK, templates);
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { getTemplates };
