// const fs = require("fs");

// Good practice to create the path by joining the folder and file
// const path = require("path");

// fs.readFile(path.join(__dirname, "files", "short.txt"), "utf8", (err, data) => {
//   if (err) throw err;
//   console.log("Short: ", data);
// });

// fs.readFile("./files/short.txt", "utf8", (err, data) => {
//   if (err) throw err;
//   console.log(data);
// });

// fs.writeFile(
//   path.join(__dirname, "files", "new.txt"),
//   "This is the data to be written",
//   (err) => {
//     if (err) throw err;
//     console.log("New: ", "Write complete");
//   }
// );

// fs.appendFile(
//   path.join(__dirname, "files", "new.txt"),
//   " - This is the updated text added to the new file",
//   (err) => {
//     if (err) throw err;
//     console.log("Update: ", "Update complete");
//   }
// );

// ----------------------------------------------------

const fsPromises = require("fs").promises;
const path = require("path");
const fileOps = async () => {
  try {
    const data = await fsPromises.readFile(
      path.join(__dirname, "files", "short.txt"),
      "utf-8"
    );
    console.log("Data: ", data);
    await fsPromises.writeFile(path.join(__dirname, "files", "new.txt"), data);
    await fsPromises.appendFile(
      path.join(__dirname, "files", "new.txt"),
      ". Here is an update to the new file..."
    );
    await fsPromises.rename(
      path.join(__dirname, "files", "new.txt"),
      path.join(__dirname, "files", "newRenamed.txt")
    );
    const newData = await fsPromises.readFile(
      path.join(__dirname, "files", "newRenamed.txt"),
      "utf-8"
    );
    console.log("newData: ", newData);
  } catch (err) {
    console.log(err);
  }
};

fileOps();
