import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface IStatistic {
  value: string;
  key: string;
  data?: string;
}

export type TStatisticDocument = Document & IStatistic;

const StatisticSchema = new mongoose.Schema(
  {
    value: { type: String, required: true },
    key: { type: String, required: true },
    data: { type: String, required: false },
  },
  { timestamps: true }
);

export const Statistic = mongoose.model<TStatisticDocument>(
  "Statistic",
  StatisticSchema
);
