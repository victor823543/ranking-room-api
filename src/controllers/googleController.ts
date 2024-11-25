import axios from "axios";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { User, UserProvider } from "../models/User.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

// Google OAuth 2.0 token info endpoint
const GOOGLE_TOKEN_INFO_URL = "https://www.googleapis.com/oauth2/v1/tokeninfo";

async function googleLogin(req: Request, res: Response) {
  const { token } = req.body;

  try {
    // Verify the OAuth access token using Google's token info endpoint
    const tokenInfoResponse = await axios.get(
      `${GOOGLE_TOKEN_INFO_URL}?access_token=${token}`,
    );
    const tokenInfo = tokenInfoResponse.data;

    const { user_id: googleId, email, expires_in } = tokenInfo;

    if (!googleId || !email) {
      throw new ErrorResponse(
        ErrorCode.UNAUTHORIZED,
        "Invalid Google OAuth token",
      );
    }

    // Check if the user already exists in the database
    let user = await User.findOne({ googleId });
    if (!user) {
      const profileResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const { name: username } = profileResponse.data;

      user = await User.create({
        googleId,
        email,
        username,
        provider: UserProvider.GOOGLE,
      });
    }

    // Create a JWT token
    const appToken = jwt.sign(
      { _id: user._id, email: user.email, username: user.username },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "12h" },
    );

    sendValidResponse(res, SuccessCode.OK, { token: appToken });
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Internal Server Error");
  }
}

export default { googleLogin };
