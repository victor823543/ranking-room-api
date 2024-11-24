import { Request, Response } from "express";
import { FriendRequest } from "../models/FriendRequest.js";
import { TokenPayload, User } from "../models/User.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type SentRequest = {
  _id: string;
  receiverName: string;
  receiverId: string;
  timestamp: number;
};

type ReceivedRequest = {
  _id: string;
  senderName: string;
  senderId: string;
  timestamp: number;
};

type ListFriendRequestsResponse = {
  sentRequests: SentRequest[];
  receivedRequests: ReceivedRequest[];
};

async function sendFriendRequest(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const friendId = req.params.friendId;

  const findUser = await User.findOne({ _id: user._id });

  if (findUser === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the user.");
  }

  const findFriend = await User.findOne({ _id: friendId });

  if (findFriend === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the friend.");
  }

  try {
    await FriendRequest.create({
      senderId: user._id,
      receiverId: friendId,
    });

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function respondToFriendRequest(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;
  const requestId = req.params.requestId;
  const { accept } = req.body;

  const findRequest = await FriendRequest.findOne({ _id: requestId });

  if (findRequest === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the request.");
  }

  if (findRequest.receiverId.toString() !== user._id) {
    throw new ErrorResponse(
      ErrorCode.UNAUTHORIZED,
      "You are not authorized to respond to this request.",
    );
  }

  try {
    await FriendRequest.deleteOne({ _id: requestId });
    let response = { message: "Friend request has been declined." };
    if (accept) {
      await User.updateOne(
        { _id: findRequest.senderId },
        { $addToSet: { friends: findRequest.receiverId } },
      );

      await User.updateOne(
        { _id: findRequest.receiverId },
        { $addToSet: { friends: findRequest.senderId } },
      );
      response = { message: "Friend request has been accepted." };
    }

    return sendValidResponse(res, SuccessCode.OK, response);
  } catch {
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function listFriendRequests(req: Request, res: Response) {
  const user: TokenPayload = res.locals.user;

  const findSentRequests = await FriendRequest.find({ senderId: user._id });
  const findReceivedRequests = await FriendRequest.find({
    receiverId: user._id,
  });

  const sentRequests = await Promise.all(
    findSentRequests.map(async (request) => {
      const receiver = await User.findOne({ _id: request.receiverId });
      return {
        _id: request._id.toString(),
        receiverName: receiver?.username || "",
        receiverId: request.receiverId.toString(),
        timestamp: request.timestamp,
      };
    }),
  );

  const receivedRequests = await Promise.all(
    findReceivedRequests.map(async (request) => {
      const sender = await User.findOne({ _id: request.senderId });
      return {
        _id: request._id.toString(),
        senderName: sender?.username || "",
        senderId: request.senderId.toString(),
        timestamp: request.timestamp,
      };
    }),
  );

  const response: ListFriendRequestsResponse = {
    sentRequests: sentRequests,
    receivedRequests: receivedRequests,
  };

  return sendValidResponse<ListFriendRequestsResponse>(
    res,
    SuccessCode.OK,
    response,
  );
}

export default {
  sendFriendRequest,
  respondToFriendRequest,
  listFriendRequests,
};
