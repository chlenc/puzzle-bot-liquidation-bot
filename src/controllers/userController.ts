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

export const updateStage = async (updated: {}, userId: number) => {
  const user = await getUserById(userId);
  if (user != null) {
    const updatedUser = await User.findByIdAndUpdate(user._id, updated).exec();
    console.log(updatedUser);
  }
};
export const getUserById = (id: number) =>
  User.findOne((user) => (user ? user.id === id : false)).exec();
