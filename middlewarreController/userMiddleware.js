const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretKey = process.env.secretKey;
const TheAdminPassword = process.env.ADMIN_PASSWORD; 
const {redisClient} = require ('../database/redisclient');


const isAdminUser = async (req, res, next) => {
  const { username, password } = req.body;
  const adminUsername = "admin";
  
  try {
    redisClient.hget("admin", "password", async (err, hashedAdminPassword) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error retrieving admin credentials");
      } else {
        if (hashedAdminPassword) {
          const isPasswordMatched = await bcrypt.compare(
            password,
            hashedAdminPassword
          );

          if (username === adminUsername && isPasswordMatched) {
            req.session.user = { username: adminUsername, role: "admin" };
            next();
          } else {
            res.status(401).send("Invalid credentials");
          }
        } else {
          res.status(401).send("Invalid credentials");
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred during admin login.");
  }
};

const isRegisterUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = {
      username,
      password: hashedPassword,
      userId: generateUserId(),
    };

    function generateUserId() {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36);
      return timestamp + random;
    }

    redisClient.hset("users", user.userId, JSON.stringify(user), (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("There is an error in registering user");
      } else {
        res.sendStatus(201); // Created
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("There is an error in registering user");
  }
};
const isAuthenticatedUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    redisClient.hget("users", username, async (err, userData) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error logging in");
      } else {
        if (userData) {
          const user = JSON.parse(userData);
          const isPasswordMatched = await bcrypt.compare(
            password,
            user.password
          );
          if (isPasswordMatched) {
            req.user = { username, userId: user.userId };
            next();
          } else {
            res.status(401).send("Invalid login credentials");
          }
        } else {
          res.status(401).send("Invalid login credentials");
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred during login.");
  }
};

//Controller

const createBlogPost = (req, res) => {
  try {
    const { title, body } = req.body;
    const { userId } = req.user; 
    const blogPost = {
      title,
      body,
      date: new Date().toISOString(),
      userId,
    };

    function generateBlogId() {
      const uniqueId =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now();
      const blogId = uniqueId + "_" + timestamp;
      return blogId;
    }
    const postId = generateBlogId(); 
    redisClient.hset(
      "posts",
      postId,
      JSON.stringify(blogPost),
      (err, reply) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error creating blog post");
        } else {
          res.sendStatus(201); // Created
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating blog post");
  }
};

const getAllBlogPosts = (req, res) => {
  redisClient.hgetall("posts", (err, blogPosts) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving blog posts");
    } else {
      const posts = Object.values(blogPosts).map((post) => JSON.parse(post));
      res.json(posts);
    }
  });
};


const getOneBlogPost = (req, res) => {
  const { id } = req.params;
  redisClient.hget("posts", id, (err, blogPost) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving blog post");
    } else {
      if (blogPost) {
        res.json(JSON.parse(blogPost));
      } else {
        res.status(404).send("Blog post not found");
      }
    }
  });
};

const deleteBlogPost = (req, res) => {
  const { id } = req.params;

  redisClient.hdel("posts", id, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error deleting blog post");
    } else {
      if (result === 1) {
        res.sendStatus(204);
      } else {
        res.status(404).send("Blog post not found");
      }
    }
  });
};

module.exports = {
  isAdminUser,
  isAuthenticatedUser,
  isRegisterUser,
  createBlogPost,
  getAllBlogPosts,
  getOneBlogPost,
  deleteBlogPost,
};
