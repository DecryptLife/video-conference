const express = require("express");
const app = express();
const http = require("http");

// when a user logs in use password hashing: never store plain-text password. A library that could be used to do this - bcrypt

// implement rate limiting on login attemps to prevent brute force attempts

// after successful login - generate token and send it back to the user (JWT), store token on client side securely - HTTP only cookies to prevent XSS attacks

app.listen(3000, () => {
  console.log("Server listening on 3000");
});
