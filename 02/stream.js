const fs = require("fs");
const path = require("path");

const rs = fs.createReadStream(path.join(__dirname, "files", "long.txt"), {
  encoding: "utf8",
});

const ws = fs.createWriteStream(path.join(__dirname, "files", "new-long.txt"));

// 1

// rs.on("data", (dataChunk) => {
//   ws.write(dataChunk);
// });

// 2

rs.pipe(ws);
