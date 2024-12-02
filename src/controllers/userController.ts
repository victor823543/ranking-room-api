import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config.js";
import { FriendRequest } from "../models/FriendRequest.js";
import { TokenPayload, User } from "../models/User.js";
import { Indef } from "../types/general.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type SignNewTokenResponse = {
  token: string;
};

type LoginResponse = {
  token: string;
};

type UpdateUserResponse = Partial<{
  username: string;
  password: string;
}>;

type UpdateUserParams = Partial<{
  username: string;
  password_hash: string;
}>;

type UserInfo = {
  _id: string;
  username: string;
};

type FriendInfo = {
  _id: string;
  username: string;
  friends: UserInfo[];
};

async function validateToken(req: Request, res: Response) {
  const authorizationHeader = req.headers.authorization;
  const token =
    authorizationHeader && authorizationHeader.replace(/^Bearer\s/, "");

  // Check if token is defined in authorization headers

  if (token === undefined) {
    throw new ErrorResponse(
      ErrorCode.UNAUTHORIZED,
      "No token in authorization header.",
    );
  }

  try {
    // Verify JWT token
    const tokenPayload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    // If all good, return token payload
    return sendValidResponse<TokenPayload>(res, SuccessCode.OK, tokenPayload);
  } catch {
    throw new ErrorResponse(ErrorCode.UNAUTHORIZED, "Token is not valid.");
  }
}

async function signNewToken(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // Look for the user in the database by id
  const findUser = await User.findOne({
    _id: user._id,
  });

  // If no result, return an error
  if (findUser === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "Couldn't find a user with that Id.",
    );
  }

  const payload: TokenPayload = {
    _id: findUser._id.toString(),
    email: findUser.email,
    username: findUser.username,
  };

  try {
    // Sign a JWT token with user information
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });
    // If all good, return JWT token
    return sendValidResponse<SignNewTokenResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when signing the token.",
    );
  }
}

async function login(req: Request, res: Response) {
  const email: Indef<string> = req.body.email;
  const password: Indef<string> = req.body.password;

  if (email === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  if (password === undefined) {
    throw new ErrorResponse(
      ErrorCode.PRECONDITION_REQUIRED,
      "Password is required.",
    );
  }

  const findUser = await User.findOne({ email });

  if (findUser === null) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const password_hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  if (findUser.password_hash !== password_hash) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Wrong email or password.");
  }

  try {
    const payload = {
      _id: findUser._id.toString(),
      email: findUser.email,
      username: findUser.username,
    };

    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

    return sendValidResponse<LoginResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch (err: unknown) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function signup(req: Request, res: Response) {
  const email: Indef<string> = req.body.email;
  const username: Indef<string> = req.body.username;
  const password: Indef<string> = req.body.password;

  if (email === undefined || username === undefined || password === undefined) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "All fields must be filled");
  }

  try {
    const password_hash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const result = await User.create({ email, username, password_hash });

    const payload = {
      _id: result._id.toString(),
      email: result.email,
      username: result.username,
    };

    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

    return sendValidResponse<LoginResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function update(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const params: UpdateUserResponse = req.body;

  try {
    let updatedFields: UpdateUserParams = { username: params.username };

    if (params.password) {
      const password_hash = crypto
        .createHash("sha256")
        .update(params.password)
        .digest("hex");

      updatedFields.password_hash = password_hash;
    }

    await User.updateOne({ _id: user._id }, { $set: updatedFields });

    const payload = {
      _id: user._id.toString(),
      email: user.email,
      username: params.username || user.username,
    };

    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

    return sendValidResponse<LoginResponse>(res, SuccessCode.OK, {
      token,
    });
  } catch (error) {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function remove(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  // Look for the user in the database by id
  const findUser = await User.findOne({
    _id: user._id,
  });

  // If no result, return an error
  if (findUser === null) {
    throw new ErrorResponse(
      ErrorCode.NO_RESULT,
      "Couldn't find a user with that Id.",
    );
  }

  try {
    // Delete the user itself
    const result = await User.deleteOne({ _id: user._id });

    if (result.deletedCount === 0) {
      throw new Error();
    }

    // Delete the user from all friends' friends list
    await User.updateMany(
      { _id: { $in: findUser.friends } },
      { $pull: { friends: user._id } },
    );

    // Delete the friend requests from and to user
    const deleteResult = await FriendRequest.deleteMany({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    });

    // Log the number of friend requests deleted
    console.log(`Deleted ${deleteResult.deletedCount} friend requests.`);

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (err) {
    throw new ErrorResponse(
      ErrorCode.SERVER_ERROR,
      "Something went wrong when removing the user.",
    );
  }
}

async function listAllUsers(req: Request, res: Response) {
  const users: UserInfo[] = await User.find({}, { username: 1, _id: 1 });

  return sendValidResponse<UserInfo[]>(res, SuccessCode.OK, users);
}

async function getFriendById(req: Request, res: Response) {
  const userId: string = req.params.id;

  const findUser = await User.findOne({ _id: userId });
  if (findUser === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the user.");
  }

  const friends: UserInfo[] = await User.find(
    { _id: { $in: findUser.friends } },
    { username: 1, _id: 1 },
  );

  const userResponse: FriendInfo = {
    username: findUser.username,
    _id: findUser._id.toString(),
    friends: friends.map((friend) => ({
      _id: friend._id,
      username: friend.username,
    })),
  };

  return sendValidResponse<FriendInfo>(res, SuccessCode.OK, userResponse);
}

async function listFriends(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  const findUser = await User.findOne({ _id: user._id });

  if (findUser === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the user.");
  }

  const friends = await User.find(
    { _id: { $in: findUser.friends } },
    { username: 1, friends: 1 },
  );

  const friendsList: FriendInfo[] = await Promise.all(
    friends.map(async (friend) => {
      const friendFriends = await User.find(
        { _id: { $in: friend.friends } },
        { username: 1, _id: 1 },
      );
      return {
        _id: friend._id.toString(),
        username: friend.username,
        friends: friendFriends.map((f) => ({
          _id: f._id.toString(),
          username: f.username,
        })),
      };
    }),
  );

  return sendValidResponse<FriendInfo[]>(res, SuccessCode.OK, friendsList);
}

export default {
  validateToken,
  signNewToken,
  login,
  signup,
  update,
  remove,
  listAllUsers,
  getFriendById,
  listFriends,
};
