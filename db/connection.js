const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
// mongoose.set('debug', true);
mongoose
  .connect(process.env.DATABASE, { dbName: "Gojango" })
  .then(() => console.log("mongoDB connected"))
  .catch((err) => console.log(err));
