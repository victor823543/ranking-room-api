import { Request, Response } from "express";
import { IObject, Object as RankingObject } from "../models/Object.js";
import { IRoom, RankingSystem, Room, UserPrivilage } from "../models/Room.js";
import { ErrorCode, SuccessCode } from "../utils/constants.js";
import { ErrorResponse, sendValidResponse } from "../utils/sendResponse.js";

type ObjectRanking =
  | {
      rankingSystem: RankingSystem.RANK;
      objectRanking: Array<{ object: string; rank: number }>;
    }
  | {
      rankingSystem: RankingSystem.POINTS;
      objectRanking: Array<{ object: string; points: number }>;
    }
  | {
      rankingSystem: RankingSystem.TIER;
      objectRanking: Array<{ object: string; tier: number }>;
    }
  | {
      rankingSystem: RankingSystem.CATEGORY;
      objectRanking: Array<{
        object: string;
        categoryRanking: Record<string, number>;
      }>;
    };

type ObjectProps = { name: string; image?: string };

type AddObjectsToRoomBody = {
  objects: ObjectProps[];
};

async function rankObjects(req: Request, res: Response) {
  const { user } = res.locals;
  const { roomId } = req.params;
  const { rankingSystem, objectRanking }: ObjectRanking = req.body;

  const room = await Room.findOne({ _id: roomId });

  if (room === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the room.");
  }
  // Check if the user is allowed to rank objects
  const roomUser = room.users.find(
    (roomUser) => roomUser.userId.toString() === user._id,
  );

  if (roomUser === undefined) {
    throw new ErrorResponse(
      ErrorCode.FORBIDDEN,
      "You do not have access to this room.",
    );
  }

  if (!roomUser.privilages.includes(UserPrivilage.RANK)) {
    throw new ErrorResponse(
      ErrorCode.FORBIDDEN,
      "You do not have the permission to rank objects in this room.",
    );
  }

  try {
    console.log(objectRanking);
    console.log(rankingSystem);
    // Rank objects
    await Promise.all(
      objectRanking.map(async (object) => {
        switch (rankingSystem) {
          case RankingSystem.TIER:
            if ("tier" in object) {
              const result = await RankingObject.findById(object.object);
              if (result === null) {
                throw new ErrorResponse(
                  ErrorCode.NO_RESULT,
                  "Couldn't find the object.",
                );
              }
              const userRanking = result.ranking.find(
                (ranking) => ranking.user === user._id,
              );
              if (userRanking === undefined) {
                result.ranking.push({ user: user._id, tier: object.tier });
              } else {
                userRanking.tier = object.tier;
              }

              // Calculate average ranking points
              const totalRankingPoints = result.ranking.reduce(
                (acc, ranking) => acc + (ranking.tier as number),
                0,
              );
              result.averageRankingPoints =
                totalRankingPoints / result.ranking.length;

              await result.save();
            }
            break;
          case RankingSystem.POINTS:
            if ("points" in object) {
              const result = await RankingObject.findById(object.object);
              if (result === null) {
                throw new ErrorResponse(
                  ErrorCode.NO_RESULT,
                  "Couldn't find the object.",
                );
              }
              const userRanking = result.ranking.find(
                (ranking) => ranking.user.toString() === user._id,
              );
              if (userRanking === undefined) {
                result.ranking.push({ user: user._id, points: object.points });
              } else {
                userRanking.points = object.points;
              }

              // Calculate average ranking points
              const totalRankingPoints = result.ranking.reduce(
                (acc, ranking) => acc + (ranking.points as number),
                0,
              );
              result.averageRankingPoints =
                totalRankingPoints / result.ranking.length;

              await result.save();
            }
            break;
          case RankingSystem.RANK:
            if ("rank" in object) {
              const result = await RankingObject.findById(object.object);
              if (result === null) {
                throw new ErrorResponse(
                  ErrorCode.NO_RESULT,
                  "Couldn't find the object.",
                );
              }
              console.log(result.ranking);
              console.log(user._id);
              const userRanking = result.ranking.find(
                (ranking) => ranking.user.toString() === user._id,
              );
              console.log(userRanking);
              if (userRanking === undefined) {
                result.ranking.push({ user: user._id, rank: object.rank });
                console.log("did push", { user: user._id, rank: object.rank });
              } else {
                userRanking.rank = object.rank;
              }

              // Calculate average ranking points
              const totalRankingPoints = result.ranking.reduce(
                (acc, ranking) =>
                  acc +
                  convertRankToPoints(
                    ranking.rank as number,
                    room.objects.length,
                  ),
                0,
              );
              console.log(totalRankingPoints);
              console.log(totalRankingPoints / result.ranking.length);
              result.averageRankingPoints =
                totalRankingPoints / result.ranking.length;

              await result.save();
            }
            break;
          case RankingSystem.CATEGORY:
            if ("categoryRanking" in object) {
              const result = await RankingObject.findById(object.object);
              if (result === null) {
                throw new ErrorResponse(
                  ErrorCode.NO_RESULT,
                  "Couldn't find the object.",
                );
              }
              const userRanking = result.ranking.find(
                (ranking) => ranking.user === user._id,
              );
              if (userRanking === undefined) {
                result.ranking.push({
                  user: user._id,
                  categoryRanking: object.categoryRanking,
                });
              } else {
                userRanking.categoryRanking = object.categoryRanking;
              }

              // Calculate average ranking points
              const totalRankingPoints = result.ranking.reduce(
                (acc, ranking) =>
                  acc +
                  Object.values(
                    ranking.categoryRanking as Record<string, number>,
                  ).reduce((acc, category) => acc + category, 0),
                0,
              );
              result.averageRankingPoints =
                totalRankingPoints / result.ranking.length;

              // Calculate average points for each category
              const categoryRanking: Record<string, number> = {};
              result.ranking.forEach((ranking) => {
                Object.entries(
                  ranking.categoryRanking as Record<string, number>,
                ).forEach(([category, points]) => {
                  if (category in categoryRanking) {
                    categoryRanking[category] += points;
                  } else {
                    categoryRanking[category] = points;
                  }
                });
              });

              Object.entries(categoryRanking).forEach(([category, points]) => {
                categoryRanking[category] = points / result.ranking.length;
              });

              result.averageCategoryPoints = categoryRanking;

              await result.save();
            }
        }
      }),
    );

    return sendValidResponse(res, SuccessCode.NO_CONTENT);
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

const convertRankToPoints = (rank: number, total: number): number => {
  return total - rank + 1;
};

async function addObjectsToRoom(req: Request, res: Response) {
  const { user } = res.locals;
  const { roomId } = req.params;
  const { objects }: AddObjectsToRoomBody = req.body;

  const room = await Room.findOne({ _id: roomId });

  if (room === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the room.");
  }

  // Check if the user is allowed to add objects
  const roomUser = room.users.find(
    (roomUser) => roomUser.userId.toString() === user._id,
  );
  if (roomUser === undefined) {
    throw new ErrorResponse(
      ErrorCode.FORBIDDEN,
      "You do not have access to this room.",
    );
  }

  if (!roomUser.privilages.includes(UserPrivilage.ADD)) {
    throw new ErrorResponse(
      ErrorCode.FORBIDDEN,
      "You do not have the permission to add objects to this room.",
    );
  }

  try {
    // Add objects to room
    const objectsResult = await Promise.all(
      objects.map((object) =>
        RankingObject.create({
          name: object.name,
          image: object.image || undefined,
          room: room._id,
          createdBy: user._id,
        }),
      ),
    );

    const objectIds = objectsResult.map((object) => object._id);

    await Room.updateOne(
      { _id: room._id },
      { $push: { objects: { $each: objectIds } } },
    );

    return sendValidResponse(res, SuccessCode.OK, { roomId: room._id });
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

async function updateObject(req: Request, res: Response) {
  const { user } = res.locals;
  const { objectId } = req.params;
  const { image }: { image: string } = req.body;

  if (!image) {
    throw new ErrorResponse(ErrorCode.BAD_REQUEST, "Invalid parameters.");
  }

  const findObject = await RankingObject.findOne({
    _id: objectId,
  });

  if (findObject === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the object.");
  }

  // CHeck if the user has edit privilage in the room
  const room = await Room.findOne({ _id: findObject.room });
  if (room === null) {
    throw new ErrorResponse(ErrorCode.NO_RESULT, "Couldn't find the room.");
  }

  const roomUser = room.users.find(
    (roomUser) => roomUser.userId.toString() === user._id,
  );

  if (roomUser === undefined) {
    throw new ErrorResponse(
      ErrorCode.FORBIDDEN,
      "You do not have access to this room.",
    );
  }

  if (!roomUser.privilages.includes(UserPrivilage.EDIT)) {
    throw new ErrorResponse(
      ErrorCode.FORBIDDEN,
      "You do not have the permission to edit objects in this room.",
    );
  }

  if (image) {
    findObject.image = image;
  }

  await findObject.save();

  return sendValidResponse(res, SuccessCode.OK, { roomId: findObject.room });
}

async function listAll(req: Request, res: Response) {
  const { user } = res.locals;

  try {
    const rooms: IRoom[] = await Room.find({
      users: { $elemMatch: { userId: user._id } },
    });

    const roomIds = rooms.map((room) => room._id);

    const objects: IObject[] = await RankingObject.find({
      room: { $in: roomIds },
    });

    return sendValidResponse<{ objects: IObject[] }>(res, SuccessCode.OK, {
      objects,
    });
  } catch (error) {
    console.error(error);
    throw new ErrorResponse(ErrorCode.SERVER_ERROR, "Something went wrong.");
  }
}

export default { rankObjects, addObjectsToRoom, updateObject, listAll };
