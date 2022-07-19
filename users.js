import express from "express";
import bcrypt from "bcrypt";
import { createUsersignup, getUserFromDB as getUserFromDB } from "./userDOA.js";
import jwt from "jsonwebtoken";
import { client } from "./index.js";
import Crypto from "crypto";
import nodemailer from "nodemailer";
const router = express.Router();
router.use(express.json());

async function getHashedPassword(password) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log("hashed pass is", hashedPassword, salt);
  return hashedPassword;
}

//middleware(inbuid) - express.json();
router.post("/signup", express.json(), async function (req, res) {
  console.log("inside user signup");
  const { username, firstname, lastname, usertype } = req.body;
  const isuserexist = await getUserFromDB({ username: username });
  console.log("isuserexist", isuserexist);
  if (isuserexist) {
    res.status(400).send({ message: "username already exists" });
  } else if (firstname.length < 2) {
    res
      .status(400)
      .send({ message: "First name length should be atleast 2 characters" });
  } else if (lastname.length < 2) {
    res
      .status(400)
      .send({ message: "Last name length should be atleast 2 characters" });
  } else if (!usertype) {
    res.status(400).send({ message: "Please select proper user Type" });
  } else if (!usertype) {
    res.status(400).send({ message: "usrename already exists" });
  } else {
    const data = req.body;
    // let hashedPassword = await getHashedPassword(password);
    console.log("data", data);
    const result = await createUsersignup({
      username: username,
      firstname: firstname,
      lastname: lastname,
      usertype: usertype,
    });
    res.send(result);
  }
});

router.post("/login", async function (req, res) {
  const { username, password } = req.body;
  console.log("username", username);
  const userFromDB = await getUserFromDB({ username: username });
  console.log("userFromDB", userFromDB);
  if (!userFromDB) {
    res.status(400).send({ message: "Invalid Credentials" });
  } else {
    const storedPassword = userFromDB.password;
    const isPasswordMathced = await bcrypt.compare(password, storedPassword);
    console.log(isPasswordMathced);
    if (isPasswordMathced) {
      var token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY);
      res.send({
        message: "user logged successfully",
        token: token,
        auth: true,
      });
    } else {
      res.status(400).send({ message: "Invalid Credentials" });
    }
  }
});

router.post("/forgotpassword", async function (req, res) {
  const { email } = req.body;
  const data = req.body;
  console.log(email);
  const isEmailValid = await client
    .db("hackathon")
    .collection("users")
    .findOne(data);
  console.log("isEmailValid", isEmailValid);
  if (!isEmailValid) {
    res.status(401).send({ message: "Invalid email address" });
  } else {
    let resetToken = Crypto.randomBytes(16).toString("hex");
    let hashedResetToken = await getHashedPassword(resetToken);
    console.log("resetToken", resetToken);
    console.log("hashedResetToken", hashedResetToken);
    let tokenUpdate = await client
      .db("hackathon")
      .collection("users")
      .updateOne(data, {
        $set: { token: hashedResetToken, createdAt: new Date() },
      });
    sendPasswordResetMail(email, hashedResetToken);
    res.send({ message: "verification mail sent to your email address" });
  }
});

router.post("/verifyemail", async function (req, res) {
  //signup/completion
  const { email } = req.body;
  const data = req.body;
  console.log(email);
  const isEmailValid = await client.db("zen").collection("users").findOne(data);
  console.log("isEmailValid", isEmailValid);
  if (!isEmailValid) {
    res.status(401).send({ message: "Invalid email address" });
  } else {
    let resetToken = Crypto.randomBytes(16).toString("hex");
    let hashedResetToken = await getHashedPassword(resetToken);
    console.log("resetToken", resetToken);
    console.log("hashedResetToken", hashedResetToken);
    let tokenUpdate = await client
      .db("hackathon")
      .collection("users")
      .updateOne(data, {
        $set: { token: hashedResetToken, createdAt: new Date() },
      });

    res.send({ message: "verification mail sent to your email address" });
  }
});

function sendPasswordResetMail(email, token) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    // port: 465,
    // secure: process.env.NODE_ENV !== "development",
    // secure: true,
    auth: {
      user: process.env.SYSTEM_EMAIL_ID,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: process.env.CLIENT_EMAIL_ID,
    from: process.env.SYSTEM_EMAIL_ID,
    subject: "Please Verify its your",
    html:
      "<p>You're almost there!</p><br>" +
      +"<p>Click the link below to verify your email, and we'll help you get started.</p>," +
      "<p><a href=http://localhost:4000/users/verifyemail?token=" +
      token +
      " > Verify your email</a></p>",
  };
  // transporter.verify(function (error, success) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log("Server is ready to take our messages");
  //   }
  // });
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log(err);
    else console.log(info);
  });
}
export const usersRouter = router;
