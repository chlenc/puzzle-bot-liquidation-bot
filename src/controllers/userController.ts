import { User } from "../models/user";

export const getUserById = async (id: number) => {
  const user = await User.findOne((user) =>
    user ? user.id === id : false
  ).exec();
  if (user.id !== id) return null;
  return user;
};
