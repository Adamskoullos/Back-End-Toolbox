# Event Emitter

The below example first of all pulls in the installed packages to create timestamps, then we pull in the Node common core modules.
Then within the `logEvents`:

1. create current time stamp
2. create log item
3. check if the `logs` folder exists and make it if not
4. Add or append (if already exists) the `eventLogs` file adding the `logItem`

```js
const { format } = require("date-fns");
const { v4: uuid } = require("uuid");

const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

const logEvents = async (message) => {
  const dateTime = `${format(new Date(), "yyyyMMdd\tHH:mm:ss")}`;
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    if (!fs.existsSync("./logs")) {
      await fsPromises.mkdir(path.join(__dirname, "logs"));
    }
    await fsPromises.appendFile(
      path.join(__dirname, "logs", "eventLog.txt"),
      logItem
    );
    console.log("Event Logged >>>>>!");
  } catch (err) {
    console.log(err);
  }
};

module.exports = logEvents;
```

Then within `index.js`, to wire this up we need a Node `EventEmitter`.
The below example does the following:

1. pulls in the `logEvents` function
2. pulls in the Node `EventEmitter`
3. Extends the class and creates an object `myEmitter` giving it access to the EventEmitter methods
4. Sets up a listener for a `log` event, invoking `logEvents` from within the callback, also passing in the message to be logged

```js
const logEvents = require("./logEvents");

const EventEmitter = require("events");

class MyEmitter extends EventEmitter {}

// Initialise object
const myEmitter = new MyEmitter();

// Add listener for the `log` event
myEmitter.on("log", (msg) => logEvents(msg));

setTimeout(() => {
  // Emit event
  myEmitter.emit("log", "Event log message!!!!");
}, 3000);
```
