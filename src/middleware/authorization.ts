import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { IUser } from "../models/User.js";
import { ErrorCode } from "../utils/constants.js";

async function authorization(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers.authorization;
  const token =
    authorizationHeader && authorizationHeader.replace(/^Bearer\s/, "");

  if (token === undefined) {
    return res
      .status(ErrorCode.UNAUTHORIZED)
      .send({ message: "No token in authorization header." });
  }

  try {
    const user = jwt.verify(token, ACCESS_TOKEN_SECRET) as IUser;
    res.locals.user = user;

    next();
  } catch {
    return res
      .status(ErrorCode.UNAUTHORIZED)
      .send({ message: "Token is not valid." });
  }
}

export default authorization;
