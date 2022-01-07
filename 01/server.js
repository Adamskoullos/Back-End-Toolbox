const os = require("os");

console.log(os.type());
console.log(os.version());
console.log(os.homedir());

console.log(__dirname);
console.log(__filename);

const path = require("path");
console.log(path.parse(__filename).name);

// ---------------------------------

const { add, subtract } = require("./math");

console.log(add(1, 10));
