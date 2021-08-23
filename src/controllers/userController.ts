import { User } from "../models/user";

// export const createUser = async (userId: string) => {
//   const user = await User.findOne((user) => user.id === userId);
//   if (user == null) {
//     const createdUser = await User.create({ userId });
//     console.log(createdUser);
//   }
// };
// const user = await getUserById(from.id);
// user == null && (await User.create({ ...from, stage: STAGE.START }));

export const getUserById = async (id: number) => {
  const user = await User.findOne((user) =>
    user ? user.id === id : false
  ).exec();
  if (user.id !== id) return null;
  return user;
};
