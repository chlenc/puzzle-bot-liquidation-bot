import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface ITelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface IDuckUserParams {
  walletAddress?: string;
}

export type TUserDocument = Document & ITelegramUser & IDuckUserParams;

const DuckUserSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    is_bot: { type: Boolean, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    username: { type: String, required: false },
    walletAddress: { type: String, required: false },
  },
  { timestamps: true }
);

export const DuckUser = mongoose.model<TUserDocument>(
  "DuckUser",
  DuckUserSchema
);
