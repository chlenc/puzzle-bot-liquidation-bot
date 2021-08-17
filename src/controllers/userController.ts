import { DuckUser } from "../models/duckUser";

// export const createUser = async (userId: string) => {
//   const user = await DuckUser.findOne((user) => user.id === userId);
//   if (user == null) {
//     const createdUser = await DuckUser.create({ userId });
//     console.log(createdUser);
//   }
// };
// const user = await getUserById(from.id);
// user == null && (await DuckUser.create({ ...from, stage: STAGE.START }));

export const updateStage = async (updated: {}, userId: number) => {
  const user = await getUserById(userId);
  if (user != null) {
    const updatedUser = await DuckUser.findByIdAndUpdate(
      user._id,
      updated
    ).exec();
    console.log(updatedUser);
  }
};
export const getUserById = (id: number) =>
  DuckUser.findOne((user) => (user ? user.id === id : false)).exec();
