import * as mongoose from "mongoose";
import { Document } from "mongoose";

export interface IAsset {
  id: string;
  start: string;
  totalSupply: number;
  circulating: number;
  "24h_vol_usd-n": number;
  precision: number;
  name: string;
  shortcode: string;
  data: {
    "firstPrice_usd-n": number;
    "lastPrice_usd-n": number;
  } | null;
}

export type TAssetDocument = Document & IAsset;

const AssetSchema = new mongoose.Schema(
  {
    id: String,
    start: String,
    name: String,
    shortcode: String,
    precision: String,
    data: {
      "firstPrice_usd-n": Number,
      "lastPrice_usd-n": Number,
    },
  },
  { timestamps: true }
);

export const Asset = mongoose.model<TAssetDocument>("Asset", AssetSchema);
