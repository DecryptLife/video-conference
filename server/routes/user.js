const express = require("express");
const { authenticateJwt, SECRET } = require("../middleware/auth");
const { User } = require("../db");
const router = express.Router();

router.get("/signup", (req, res) => {
  // implement the signup part
});

router.get("/login", (req, res) => {
  // implement the login part
});

module.exports = router;
