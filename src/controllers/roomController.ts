import { Request, Response } from "express";
import { IObject, Object } from "../models/Object.js";
import { Pin } from "../models/Pin.js";
import {
  convertRoleToPrivilages,
  IRoom,
  RankingSystem,
  Room,
  UserPrivilage,
  UserRole,
} from "../models/Room.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type CreateRoomBody = {
  name: string;
  users?: Array<RoomUser>;
  rankingSystem: RankingSystem;
  objects: Array<{ name: string; image?: string }>;
  maxPoints?: number;
  categories?: string[];
  tierNames?: string[];
  isPublic?: boolean;
};

type UpdateRoomBody = {
  name?: string;
  users?: Array<RoomUser>;
};

type GetRoomResponse = {
  id: string;
  name: string;
  users: Array<RoomUserExtended>;
  rankingSystem: RankingSystem;
  maxPoints?: number;
  categories?: string[];
  tierNames?: string[];
  objects: Array<IObject>;
  isPinned: boolean;
};

type ListRoomsResponse = Array<{
  id: string;
  name: string;
  users: Array<RoomUserExtended>;
  objects: Array<IObject>;
  timestamp: number;
  rankingSystem: RankingSystem;
  isPinned: boolean;
}>;

type PopulatedRoomUser = {
  userId: {
    _id: string;
    username: string;
  };
  privilages: UserPrivilage[];
  role: UserRole;
};

type PopulatedRoom = {
  users: PopulatedRoomUser[];
  objects: IObject[];
} & IRoom;

export type RoomUser = {
  userId: string;
  privilages: UserPrivilage[];
  role: UserRole;
};

type RoomUserExtended = RoomUser & {
  username: string;
};

async function createRoom(req: Request, res: Response) {
  const { user } = res.locals;
  const { name, users, rankingSystem, objects }: CreateRoomBody = req.body;

  if (!name || !rankingSystem || !objects) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const roomUsers: RoomUser[] = [
    {
      userId: user._id,
      privilages: convertRoleToPrivilages[UserRole.ADMIN],
      role: UserRole.ADMIN,
    },
  ].concat(users || []);

  try {
    const newRoom: IRoom = await Room.create({
      name,
      rankingSystem,
      users: roomUsers,
      public: false,
    });

    if (newRoom === null) {
      throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Couldn't create room.");
    }

    if (objects.length > 0) {
      const objectsResult = await Promise.all(
        objects.map((object) =>
          Object.create({
            name: object.name,
            image: object.image || undefined,
            room: newRoom._id,
            createdBy: user._id,
          }),
        ),
      );

      const objectIds = objectsResult.map((object) => object._id);

      await Room.updateOne(
        { _id: newRoom._id },
        { $set: { objects: objectIds } },
      );
    }

    const response = { roomId: newRoom._id.toString() };
    return sendValidResponse<{ roomId: string }>(
      res,
      SuccessCode.CREATED,
      response,
    );
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function updateRoom(req: Request, res: Response) {
  const { user } = res.locals;
  const roomId: string = req.params.id;
  const { name, users }: UpdateRoomBody = req.body;

  if (!name && !users) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const findRoom = (await Room.findOne({
    _id: roomId,
  })) as IRoom | null;

  if (findRoom === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the room.");
  }

  const userInRoom = findRoom.users.find(
    (roomUser) => roomUser.userId.toString() === user._id,
  );

  if (!userInRoom) {
    throw new ErrorResponse(ErrorCode.FORBIDDEN, "You are not in the room.");
  }

  if (userInRoom.privilages.indexOf(UserPrivilage.EDIT) === -1) {
    throw new ErrorResponse(ErrorCode.FORBIDDEN, "You don't have permission.");
  }

  try {
    if (name) {
      await Room.updateOne({ _id: roomId }, { $set: { name } });
    }

    if (users) {
      await Room.updateOne({ _id: roomId }, { $set: { users } });
    }
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function deleteRoom(req: Request, res: Response) {
  const { user } = res.locals;
  const roomId: string = req.params.id;

  const findRoom = await Room.findOne({
    _id: roomId,
  });

  if (findRoom === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the room.");
  }

  const userInRoom = findRoom.users.find(
    (roomUser) => roomUser.userId.toString() === user._id,
  );

  if (!userInRoom) {
    throw new ErrorResponse(ErrorCode.FORBIDDEN, "You are not in the room.");
  }

  if (userInRoom.privilages.indexOf(UserPrivilage.DELETE) === -1) {
    throw new ErrorResponse(ErrorCode.FORBIDDEN, "You don't have permission.");
  }

  try {
    await Room.deleteOne({ _id: roomId });
    await Object.deleteMany({ room: roomId });
    console.log(
      `Room with ID ${roomId} was deleted along with ${findRoom.objects.length} objects.`,
    );
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

async function getRoomById(req: Request, res: Response) {
  const roomId: string = req.params.id;
  const { user } = res.locals;

  const findRoom = (await Room.findOne({
    _id: roomId,
  })
    .populate("users.userId")
    .populate("objects")
    .lean()) as PopulatedRoom | null;

  if (findRoom === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the room.");
  }

  // Check if the room is pinned by user
  const isPinned = await Pin.findOne({ userId: user._id, roomId });

  const users = findRoom.users.map((user) => ({
    userId: user.userId._id.toString(),
    privilages: user.privilages,
    role: user.role,
    username: user.userId.username,
  }));

  const response: GetRoomResponse = {
    id: findRoom._id.toString(),
    name: findRoom.name,
    users,
    rankingSystem: findRoom.rankingSystem,
    maxPoints: findRoom.maxPoints,
    categories: findRoom.categories,
    tierNames: findRoom.tierNames,
    objects: findRoom.objects,
    isPinned: !!isPinned,
  };

  return sendValidResponse<GetRoomResponse>(res, SuccessCode.OK, response);
}

async function listRooms(req: Request, res: Response) {
  const rooms = await Room.find({ public: true });

  const roomList = rooms.map((room) => ({
    id: room._id,
    name: room.name,
  }));

  return sendValidResponse(res, SuccessCode.OK, roomList);
}

async function listUserRooms(req: Request, res: Response) {
  const { user } = res.locals;

  const rooms = (await Room.find({
    "users.userId": user._id,
  })
    .populate("users.userId")
    .populate("objects")
    .lean()) as any[];

  if (rooms.length === 0) {
    return sendValidResponse(res, SuccessCode.OK, []);
  }

  // Check if the room is pinned by user
  const isPinned = await Pin.findOne({ userId: user._id });

  const roomList: ListRoomsResponse = rooms.map((room) => ({
    id: room._id,
    name: room.name,
    timestamp: room.timestamp,
    rankingSystem: room.rankingSystem,
    users: room.users.map((user: any) => ({
      userId: user.userId._id.toString(),
      privilages: user.privilages,
      role: user.role,
      username: user.userId.username,
    })),
    objects: room.objects,
    isPinned: isPinned
      ? isPinned.roomId.toString() === room._id.toString()
      : false,
  }));

  const sortedRoomList = roomList.sort((a, b) => b.timestamp - a.timestamp);

  return sendValidResponse<ListRoomsResponse>(
    res,
    SuccessCode.OK,
    sortedRoomList,
  );
}

async function pinRoom(req: Request, res: Response) {
  const { user } = res.locals;
  const roomId: string = req.params.id;
  try {
    const findPin = await Pin.findOne({ userId: user._id });

    if (findPin) {
      if (findPin.roomId.toString() === roomId) {
        await findPin.deleteOne();
        return sendValidResponse(res, SuccessCode.NO_CONTENT);
      }
      await Pin.updateOne({ userId: user._id }, { $set: { roomId } });
    } else {
      await Pin.create({ userId: user._id, roomId });
    }
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }

  return sendValidResponse(res, SuccessCode.NO_CONTENT);
}

export default {
  createRoom,
  getRoomById,
  listUserRooms,
  updateRoom,
  deleteRoom,
  pinRoom,
};
