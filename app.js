const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const GitHubStrategy = require("passport-github").Strategy;
const path = require("path");
const app = express();
const redis = require("redis");
const port = 5000;
const { redisClient } = require("./database/redisclient");
require("dotenv").config();

//Controller and middleware
const {
  createBlogPost,
  getAllBlogPosts,
  getOneBlogPost,
  isAdminUser,
  isAuthenticatedUser,
  isRegisterUser,
  deleteBlogPost,
} = require("./middlewarreController/userMiddleware");

// Session and Flash Middleware
app.use(
  session({
    secret: process.env.secretKey,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

//Redis cloud connection
redisClient.on("connect", () => {
  console.log("Connected to Redis cloud database");
});

redisClient.on("error", (err) => {
  console.error("Error connecting to Redis Cloud:", err);
});

// Use middleware to parse JSON requests
app.use(bodyParser.json());

// Middleware
app.use(express.json());

// Routes
app.get("/index", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.post("/register", isRegisterUser, (req, res) => {
  req.session.successMessage = "User registration successful";
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", {
    successMessage: req.flash("successMessage"),
  });
});

app.post("/create-blog", isAuthenticatedUser, createBlogPost, (req, res) => {
  res.send("New blog post created!");
});
app.get("/blogs/:id", isAuthenticatedUser, getOneBlogPost);
app.get("/blogs", isAuthenticatedUser, getAllBlogPosts);


// Admin pages
app.post("/admin-login", isAdminUser, (req, res) => {
  const adminLoginPage = "admin-login";
  if (req.session.user && req.session.user.role === "admin") {
    req.session.adminSuccessMessage = "Admin login successful";
    res.redirect("/admin");
  } else {
    res.render(adminLoginPage, { errorMessage: "Invalid admin credentials" });
  }
});
app.get("/admin-login", (req, res) => {
  res.render("admin-login");
});

app.get("/admin", isAdminUser, async (req, res) => {
  try {
    const blogs = await getAllBlogPosts(req, res);
    res.render("admin", { blogs });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching blogs for admin page");
  }
});

// app.delete("/admin/delete/:id", isAdminUser, deleteBlogPost);

// To render the pages

app.use(express.static(path.join(__dirname, "public")));
const viewsPath = path.join(__dirname, "views");

app.set("views", viewsPath);
app.set("view engine", "ejs");



// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}!`);
});
