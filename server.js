require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
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
  short: Number
});
let Url = model("Url", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
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

      inputShort = 1;

      Url.findOne({}) // Empty object means all documents in a collection are selected but only the first document (in this case the one with the highest short value) is returned
        .sort({ short: "desc" }) // First finds document with highest short value
        .exec((error, result) => {
          try {
            if (result != undefined || result != null) {
              // != is used instead of !== because !== would evaluate to true due to the type of result not equaling the type of null, despite the fact that the values do equal each other
              // If a document exists, increment the short value
              inputShort = result.short + 1;
            }
            Url.findOneAndUpdate(
              { original: inputUrl },
              { original: inputUrl, short: inputShort },
              { upsert: true, new: true }, // upsert will create a document if it doesn't exist and new will return the changed document
              (error, savedUrl) => {
                try {
                  responseObject["short_url"] = savedUrl.short;
                  res.json(responseObject);
                } catch (error) {
                  return console.log(error.message);
                }
              }
            );
          } catch (error) {
            return console.log(error.message);
          }
        });
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

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
