import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface IStatistic {
  value: string;
}

export type TStatisticDocument = Document & IStatistic;

const StatisticSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
  },
  { timestamps: true }
);

export const Statistic = mongoose.model<TStatisticDocument>(
  "Statistic",
  StatisticSchema
);
