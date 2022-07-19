import { MongoClient } from "mongodb";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { usersRouter } from "./users.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongo DB connected,");
  return client;
}

export const client = await createConnection();

app.get("/", (req, res) => {
  console.log("request made");
  res.send("Hello World");
});

// app.use("/addSingleMovie", addSingleMovieRouter);
// app.use("/movies", moviesRouter);
app.use("/users", usersRouter);
//API Movies
//express converting js object to JSON and sending over HTTP
// import movieData from "./movies";

app.listen(process.env.PORT, () => {
  console.log("Listening to requests....", process.env.PORT);
});
