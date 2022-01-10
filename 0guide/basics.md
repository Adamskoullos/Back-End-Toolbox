# Basics

- [Common Core Modules](#Common-Core-Modules)
- [Custom Node Modules](#Custom-Node-Modules)
- [File System Common Core Module](#File-System-Common-Core-Module)
- [Promises, Async / Await](#Promises)

---

## Common Core Modules

```js
const os = require("os");

console.log(os.type());
console.log(os.version());
console.log(os.homedir());

console.log(__dirname);
console.log(__filename);

const path = require("path");
console.log(path.parse(__filename));
```

```
Linux
#202111250933~1638201579~21.04~09f1aa7-Ubuntu SMP Tue Nov 30 02:
/home/adamskoullos
/home/adamskoullos/Documents/GitHub/node-toolbox/01
/home/adamskoullos/Documents/GitHub/node-toolbox/01/server.js
{
  root: '/',
  dir: '/home/adamskoullos/Documents/GitHub/node-toolbox/01',
  base: 'server.js',
  ext: '.js',
  name: 'server'
}

```

## Custom Node Modules

```js
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;

module.exports = { add, subtract };
```

```js
const { add, subtract } = require("./math");

console.log(add(1, 10));
```

## File System Common Core Module

```js
const fs = require("fs");

console.log(fs);
```

```js
{
  appendFile: [Function: appendFile],
  appendFileSync: [Function: appendFileSync],
  access: [Function: access],
  accessSync: [Function: accessSync],
  chown: [Function: chown],
  chownSync: [Function: chownSync],
  chmod: [Function: chmod],
  chmodSync: [Function: chmodSync],
  close: [Function: close],
  closeSync: [Function: closeSync],
  copyFile: [Function: copyFile],
  copyFileSync: [Function: copyFileSync],
  cp: [Function: cp],
  cpSync: [Function: cpSync],
  createReadStream: [Function: createReadStream],
  createWriteStream: [Function: createWriteStream],
  exists: [Function: exists],
  existsSync: [Function: existsSync],
  fchown: [Function: fchown],
  fchownSync: [Function: fchownSync],
  fchmod: [Function: fchmod],
  fchmodSync: [Function: fchmodSync],
  fdatasync: [Function: fdatasync],
  fdatasyncSync: [Function: fdatasyncSync],
  fstat: [Function: fstat],
  fstatSync: [Function: fstatSync],
  fsync: [Function: fsync],
  fsyncSync: [Function: fsyncSync],
  ftruncate: [Function: ftruncate],
  ftruncateSync: [Function: ftruncateSync],
  futimes: [Function: futimes],
  futimesSync: [Function: futimesSync],
  lchown: [Function: lchown],
  lchownSync: [Function: lchownSync],
  lchmod: undefined,
  lchmodSync: undefined,
  link: [Function: link],
  linkSync: [Function: linkSync],
  lstat: [Function: lstat],
  lstatSync: [Function: lstatSync],
  lutimes: [Function: lutimes],
  lutimesSync: [Function: lutimesSync],
  mkdir: [Function: mkdir],
  mkdirSync: [Function: mkdirSync],
  mkdtemp: [Function: mkdtemp],
  mkdtempSync: [Function: mkdtempSync],
  open: [Function: open],
  openSync: [Function: openSync],
  opendir: [Function: opendir],
  opendirSync: [Function: opendirSync],
  readdir: [Function: readdir],
  readdirSync: [Function: readdirSync],
  read: [Function: read],
  readSync: [Function: readSync],
  readv: [Function: readv],
  readvSync: [Function: readvSync],
  readFile: [Function: readFile],
  readFileSync: [Function: readFileSync],
  readlink: [Function: readlink],
  readlinkSync: [Function: readlinkSync],
  realpath: [Function: realpath] { native: [Function (anonymous)] },
  realpathSync: [Function: realpathSync] { native: [Function (anonymous)] },
  rename: [Function: rename],
  renameSync: [Function: renameSync],
  rm: [Function: rm],
  rmSync: [Function: rmSync],
  rmdir: [Function: rmdir],
  rmdirSync: [Function: rmdirSync],
  stat: [Function: stat],
  statSync: [Function: statSync],
  symlink: [Function: symlink],
  symlinkSync: [Function: symlinkSync],
  truncate: [Function: truncate],
  truncateSync: [Function: truncateSync],
  unwatchFile: [Function: unwatchFile],
  unlink: [Function: unlink],
  unlinkSync: [Function: unlinkSync],
  utimes: [Function: utimes],
  utimesSync: [Function: utimesSync],
  watch: [Function: watch],
  watchFile: [Function: watchFile],
  writeFile: [Function: writeFile],
  writeFileSync: [Function: writeFileSync],
  write: [Function: write],
  writeSync: [Function: writeSync],
  writev: [Function: writev],
  writevSync: [Function: writevSync],
  Dir: [class Dir],
  Dirent: [class Dirent],
  Stats: [Function: Stats],
  ReadStream: [Getter/Setter],
  WriteStream: [Getter/Setter],
  FileReadStream: [Getter/Setter],
  FileWriteStream: [Getter/Setter],
  _toUnixTimestamp: [Function: toUnixTimestamp],
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
}


```

### Read, Write Update file

**Read**:

1. Path
2. `utf8` to make the text a readable string
3. Callback to do something with the data

```js
const fs = require("fs");

// Good practice to create the path by joining the folder and file
const path = require("path");

fs.readFile(path.join(__dirname, "files", "short.txt"), "utf8", (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

**Write**:

1. path with `new` file name
2. data to be written
3. Callback

```js
fs.writeFile(
  path.join(__dirname, "files", "new.txt"),
  "This is the data to be written",
  (err) => {
    if (err) throw err;
    console.log("Write complete");
  }
);
```

**Update**:

`appendFile` can create a new file if it does not already exist or append to an existing file. The below example appends some text to the existing `new.txt` file:

Arguments:

1. File path
2. data to be added to the file
3. Callback > optional

```js
fs.appendFile(
  path.join(__dirname, "files", "new.txt"),
  "\n\nThis is the updated text added to the new file",
  (err) => {
    if (err) throw err;
    console.log("Update: ", "Update complete");
  }
);
```

### Promises

The below example shows how we can control the thread by using promises.

1. create a `fsPromises`
2. Create a wrapper `async` function
3. Use `try/catch` blocks
4. Then undertake operations using `await`

Below we are reading a file, taking the data and creating a new file, then updating the new file data and then finally renaming the new file:

```js
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
```

### Streams

When reading and writing large files we can use streams to break the data up into bite size chunks for processing:

```js
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
```

### Directories

The below example shows how to check if a directory already exists and if not create it:

```js
const fs = require("fs");

if (!fs.existsSync("./new")) {
  fs.mkdir("new", (err) => {
    if (err) throw err;
    console.log("Directory created");
  });
}
```

> `rmdir` can be used to remove and existing directory
