require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const cors = require("cors");
const app = express();
var bodyParser = require("body-parser");
var validator = require("validator");

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let { Schema, model } = mongoose;

let urlSchema = new Schema({
  original: { type: String, required: true },
  short: String
});
let Url = model("Url", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

let responseObject = {};

app.post(
  "/api/shorturl",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let inputUrl, inputShort;

    if (validator.isURL(req.body["url"])) {
      inputUrl = req.body["url"]; // Capture original url inputted
      responseObject["original_url"] = inputUrl;

      inputShort = nanoid();
      
      Url.findOneAndUpdate(
      { original: inputUrl },
      { original: inputUrl, short: inputShort },
      { upsert: true, new: true }, 
      (error, savedUrl) => {
        if (!savedUrl) {
          throw new Error("savedUrl is undefined");
        }

        if (error) {
          return console.log(error.message)
        }
        
        responseObject["short_url"] = savedUrl.short;
        res.json(responseObject);
      })   
        
    } else if (!validator.isURL(req.body["url"])) {
      responseObject["error"] = "invalid URL";
      res.json(responseObject);
    }
  }
);

app.get("/api/shorturl/:input", (req, res) => {
  let input = req.params.input;

  Url.findOne({ short: input }, (err, result) => {
    try {
      if (result != undefined) {
        // findOne will return undefined if no document is found, hence the redirect must only function when undefined is not returned
        res.redirect(result.original);
      }
    } catch {
      return console.log(err.message);
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
