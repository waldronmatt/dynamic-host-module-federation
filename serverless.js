import express from "express";
import path from "path";

// setup
const app = express();

// port
const PORT = process.env.PORT || 8000;

// use express.static() to serve files from several directories
app.use(express.static(__dirname));

// path must route to lambda
app.use("/.netlify/functions/server", router);

// config
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`);
  console.log("Press Ctrl+C to quit.");
});

module.exports.handler = serverless(app);
