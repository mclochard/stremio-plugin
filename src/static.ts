import { Express } from "express";

const staticPages = (app: Express) => {
  app.get("/", (req, res) => {
    // print content of src/static/index.html
    res.sendFile(__dirname + "/static/index.html");
  });
  app.get("/styles.css", (req, res) => {
    // print content of src/static/index.html
    res.sendFile(__dirname + "/static/styles.css");
  });
};

export default staticPages;
