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
const postCollection = client.db("SocialMedia").collection("userCollection");

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
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      user.time = Date.now();
      const result = await userCollection.insertOne(user);
      console.log(result);
      res.send(result);
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
      const result = await postCollection.insertOne(post);
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
