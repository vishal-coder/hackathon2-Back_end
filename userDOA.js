import { client } from "./index.js";

export async function createUsersignup(data) {
  console.log("createUser called.");
  return await client.db("hackathon").collection("users").insertOne(data);
}

export async function getUserFromDB(data) {
  return await client.db("hackathon").collection("users").findOne(data);
}
