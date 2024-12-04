import { Schema, Types, model } from "mongoose";
import { RankingSystem } from "./Room.js";

export type TemplateObject = {
  name: string;
  image: string;
};

export type ITemplate = {
  _id: Types.ObjectId;
  name: string;
  rankingSystems: RankingSystem[];
  maxPoints?: number;
  categories?: string[];
  tierNames?: string[];
  objects: Array<TemplateObject>;
  timestamp: number;
};

const schema = new Schema<ITemplate>({
  name: {
    type: String,
    required: true,
  },
  rankingSystems: {
    type: [String],
    required: true,
    default: [RankingSystem.RANK, RankingSystem.POINTS],
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
    type: [
      {
        name: String,
        image: String,
      },
    ],
    required: true,
    default: [],
  },
  timestamp: {
    type: Number,
    required: false,
    default: () => Math.floor(new Date().getTime() / 1000),
  },
});

export const Template = model<ITemplate>("Template", schema);
