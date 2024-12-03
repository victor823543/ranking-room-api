import { Schema, Types, model } from "mongoose";

export enum UserPrivilage {
  INVITE = "INVITE",
  EDIT = "EDIT",
  DELETE = "DELETE",
  ADD = "ADD",
  RANK = "RANK",
  VIEW = "VIEW",
}

export enum UserRole {
  ADMIN = "ADMIN",
  CONTRIBUTOR = "CONTRIBUTOR",
  USER = "USER",
  VIEW_ONLY = "VIEW_ONLY",
  CUSTOM = "CUSTOM",
}

export const convertRoleToPrivilages = {
  [UserRole.ADMIN]: [
    UserPrivilage.INVITE,
    UserPrivilage.EDIT,
    UserPrivilage.DELETE,
    UserPrivilage.ADD,
    UserPrivilage.RANK,
    UserPrivilage.VIEW,
  ],
  [UserRole.CONTRIBUTOR]: [
    UserPrivilage.ADD,
    UserPrivilage.RANK,
    UserPrivilage.VIEW,
  ],
  [UserRole.USER]: [UserPrivilage.VIEW, UserPrivilage.RANK],
  [UserRole.VIEW_ONLY]: [UserPrivilage.VIEW],
  [UserRole.CUSTOM]: [],
};

export enum RankingSystem {
  TIER = "TIER",
  POINTS = "POINTS",
  RANK = "RANK",
  CATEGORY = "CATEGORY",
}

export type IRoomUser = {
  userId: Types.ObjectId;
  privilages: UserPrivilage[];
  role: UserRole;
};

export type IRoom = {
  _id: Types.ObjectId;
  name: string;
  users: Array<IRoomUser>;
  rankingSystem: RankingSystem;
  maxPoints?: number;
  categories?: string[];
  tierNames?: string[];
  objects: Array<Types.ObjectId>;
  likedBy: Array<Types.ObjectId>;
  public: boolean;
  timestamp: number;
};

const schema = new Schema<IRoom>({
  name: {
    type: String,
    required: true,
  },
  users: {
    type: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        privilages: [String],
        role: String,
      },
    ],
    required: true,
    default: [],
  },
  rankingSystem: {
    type: String,
    required: true,
    enum: Object.values(RankingSystem),
    default: RankingSystem.TIER,
  },
  maxPoints: {
    type: Number,
    required: false,
  },
  categories: {
    type: [String],
    required: false,
  },
  tierNames: {
    type: [String],
    required: false,
  },
  objects: {
    type: [{ type: Schema.Types.ObjectId, ref: "Object" }],
    required: true,
    default: [],
  },
  likedBy: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    required: false,
    default: [],
  },
  public: {
    type: Boolean,
    required: true,
    default: false,
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

export const Room = model<IRoom>("Room", schema);
