const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.Db_user}:${process.env.Db_pass}@cluster0.1f0gvrx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const userCollection = client.db("SocialMedia").collection("userCollection");
const postCollection = client.db("SocialMedia").collection("postCollection");
const likeCollection = client.db("SocialMedia").collection("likeCollection");
const commentCollection = client
  .db("SocialMedia")
  .collection("commentCollection");

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(
    "🚀 ~ file: index.js:27 ~ verifyJwt ~ authorization:",
    authorization
  );
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(",")[1];
  if (!token) {
    console.log("token not found");
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      console.log(err);
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    console.log({ decoded });
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2 days",
      });
      res.send({ token });
    });

    app.get("/", async (req, res) => {
      res.send("ok");
    });
    app.get("/users:email", async (req, res) => {
      res.send("ok");
    });
    app.get("/posts", async (req, res) => {
      const id = req.query.id;
      if (id) {
        const post = await postCollection.findOne({ _id: new ObjectId(id) });
        res.send(post).status("success", 200);
        return;
      }
      const posts = await postCollection.find({}).toArray();
      res.send(posts);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const find = await userCollection.findOne({ userId: user?.userId });
      console.log("🚀 ~ file: index.js:78 ~ app.post ~ find:", find);

      if (find) {
        res.send([1]);
      } else {
        user.time = Date.now();
        const result = await userCollection.insertOne(user);
        console.log(result);
        res.send(result);
      }
    });

    //   update use
    app.put("/users/:id", async (req, res) => {
      const body = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: body.role,
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, {
        upsert: true,
      });
      res.status(200).send(result);
    });

    app.post("/post", verifyJwt, async (req, res) => {
      const post = req.body;
      const userId = req.query.uid;
      const decodedUid = req.decoded.uid;
      console.log({ decodedEmail: decodedUid });
      if (userId !== decodedUid) {
        return res
          .status(403)
          .send({ error: true, message: "forbidden access" });
      }
      post.createdAt = Date.now();
      post.reaction = false;
      post.totalLike = 0;

      const result = await postCollection.insertOne(post);
      res.send(result);
    });
    app.put("/posts/:postId/reaction", async (req, res) => {
      const postId = req.params.postId;
      console.log("🚀 ~ file: index.js:131 ~ app.put ~ postId:", postId);
      const { reaction, totalLike, userId } = req.body;
      if (reaction) {
        const added = await likeCollection.insertOne({
          userId,
          postId,
          reaction,
        });
        console.log("🚀 ~ file: index.js:145 ~ app.put ~ added:", added);
      } else {
        const deleted = await likeCollection.deleteOne({ postId, userId });
        console.log("🚀 ~ file: index.js:147 ~ app.put ~ deleted:", deleted);
      }

      const filter = { _id: new ObjectId(postId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          totalLike: totalLike,
        },
      };
      const result = await postCollection.updateOne(filter, updateDoc, options);
      if (result.acknowledged) {
        res.send(result).status(200);
      } else {
        res.status(403).send({ error: true, message: "forbidden access" });
      }
    });
    // reaction by user id
    app.get("/reactions", async (req, res) => {
      const userId = req.query.userId;
      const result = await likeCollection.find({ userId }).toArray();
      res.send(result);
    });
    app.post("/comments", async (req, res) => {
      const { userId, postId, comment } = req.body;
      const result = await commentCollection.insertOne({
        userId,
        postId,
        comment,
      });
      res.send(result);
    });
    app.get("/comments", async (req, res) => {
      const { postId } = req.query;
      const result = await commentCollection.find({ postId }).toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, (req, res) => {
  console.log("server running on port", port);
});
