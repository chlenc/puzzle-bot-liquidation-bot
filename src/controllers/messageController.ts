import { Message } from "../models/message";

export const createMessage = async (userId: number, message: string) => {
  await Message.create({ userId, message });
};
