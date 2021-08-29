import { User } from "../models/user";

export const getUserById = async (id: number) => {
  const users = await User.find({ id: { $eq: id } }).exec();
  if (users.length == 0 || users[0].id !== id) return null;
  return users[0];
};
