const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

const User = require("../models/User.js");

const staticDir = path.join(__dirname, "../../Frontend");

app.use(express.static(staticDir));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/register", async (req, res) => {
  const { username, email, password, confirm_password } = req.body;

  if (!username || !email || !password || !confirm_password) {
    return res.status(400).send("All fields are required");
  }

  if (password !== confirm_password) {
    return res.status(401).send("Passwords do not match");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      username: username,
      email: email,
      password: hashedPassword,
    };

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Email already registered");
    }

    const newUser = new User(userData);
    await newUser.save();

    res.redirect(`/home?username=${username}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send("User not found. Please register.");
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      return res.redirect(`/home?username=${user.username}`);
    } else {
      return res.status(401).send("Incorrect password");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

module.exports = app;
