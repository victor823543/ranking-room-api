import { model, Schema, Types } from "mongoose";

type ObjectRanking = {
  user: Types.ObjectId;
  points?: number;
  rank?: number;
  tier?: number;
  categoryRanking?: Record<string, number>;
};

export type IObject = {
  _id: Types.ObjectId;
  name: string;
  image?: string;
  room: Types.ObjectId;
  ranking: ObjectRanking[];
  averageRankingPoints: number;
  averageCategoryPoints?: Record<string, number>;
  createdBy: Types.ObjectId;
  timestamp: number;
};

// Schema for the Object model
const schema = new Schema<IObject>({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  room: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  ranking: {
    type: [
      {
        user: Schema.Types.ObjectId,
        points: Number,
        rank: Number,
        tier: Number,
        categoryRanking: Schema.Types.Mixed,
      },
    ],
    required: false,
    default: [],
  },
  averageRankingPoints: {
    type: Number,
    required: true,
    default: 0,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

// Export the Object model
export const Object = model<IObject>("Object", schema);
