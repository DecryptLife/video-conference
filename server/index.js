const express = require("express");

const userRouter = require("./routes/user");
const cors = require("cors");

const path = require("path");
const exp = require("constants");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/", userRouter);

// app.use(express.static("public"));
// app.use("/*", (req, res) => {
//   res.sendFile(path.join(__dirname, "/public/index.html"));
// });
// when a user logs in use password hashing: never store plain-text password. A library that could be used to do this - bcrypt

// implement rate limiting on login attemps to prevent brute force attempts

// after successful login - generate token and send it back to the user (JWT), store token on client side securely - HTTP only cookies to prevent XSS attacks

// connect to PostgreSQL
app.listen(3000, () => {
  console.log("Server listening on 3000");
});
