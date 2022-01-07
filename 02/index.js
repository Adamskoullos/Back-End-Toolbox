const fs = require("fs");

// Good practice to create the path by joining the folder and file
const path = require("path");

fs.readFile(path.join(__dirname, "files", "short.txt"), "utf8", (err, data) => {
  if (err) throw err;
  console.log(data);
});

// fs.readFile("./files/short.txt", "utf8", (err, data) => {
//   if (err) throw err;
//   console.log(data);
// });

fs.writeFile(
  path.join(__dirname, "files", "short.txt"),
  "This is the data to be written",
  (err) => {
    if (err) throw err;
    console.log("Write complete");
  }
);
