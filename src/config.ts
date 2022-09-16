import path from "path";
// @ts-ignore
import { config } from "dotenv";
import { loadVar } from "./utils/loadVar";

config({ path: path.join(__dirname, "../.env") });

export const port = loadVar("PORT", true);

export const TOKEN = loadVar("TOKEN");
export const CHAT_ID = loadVar("CHAT_ID");
export const MONGO_URL = loadVar("MONGO_URL");
export const SEED = loadVar("SEED");
export const BEARER_TOKEN = loadVar("BEARER_TOKEN");
