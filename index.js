const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

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

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, (req, res) => {
  console.log("server running on port", port);
});
