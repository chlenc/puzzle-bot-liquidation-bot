const mongoose = require("mongoose");

export const initMongo = () =>
  mongoose
    .connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("\nConnected to MongoDB ✅  ");
      /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
    })
    .catch((err) => {
      console.log(
        `❌  MongoDB connection error. Please make sure MongoDB is running. ${err}`
      );
      // process.exit();
    });
