const http = require("http");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;

const logEvents = require("./logEvents");
const EventEmitter = require("events");
class Emitter extends EventEmitter {}

// Initialise object
const myEmitter = new Emitter();

// Add listener for the `log` event
myEmitter.on("log", (msg, fileName) => logEvents(msg, fileName));

// Create port
const PORT = process.env.PORT || 3500;

// Used within the server function to serve the data in the correct form.
// We are using the `contentType` from the below switch and case to manage this.
const serveFile = async (filePath, contentType, response) => {
  try {
    const rawData = await fsPromises.readFile(
      filePath,
      !contentType.includes("image") ? "utf8" : ""
    );
    const data =
      contentType === "application/json" ? JSON.parse(rawData) : rawData;
    response.writeHead(filePath.includes("404.html") ? 404 : 200, {
      "Content-Type": contentType,
    });
    response.end(
      contentType === "application/json" ? JSON.stringify(data) : data
    );
  } catch (err) {
    console.log(err);
    // Emit Error Event >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    myEmitter.emit("log", `${err.name}: ${err.message}`, "errLog.txt");
    response.statusCode = 500;
    response.end();
  }
};

// Create server
const server = http.createServer((req, res) => {
  console.log(req.url, req.method);
  //Emit Request Event >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  myEmitter.emit("log", `${req.url}\t${req.method}`, "reqLog.txt");

  const extension = path.extname(req.url);

  let contentType;
  // Sets the content type depending on the file extension
  switch (extension) {
    case ".css":
      contentType = "text/css";
      break;
    case ".js":
      contentType = "text/javascript";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".jpg":
      contentType = "image/jpeg";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".txt":
      contentType = "text/plain";
      break;
    default:
      contentType = "text/html";
  }

  // Set the value of the file path
  let filePath =
    // if type is html and path is to home page set to home page
    contentType === "text/html" && req.url === "/"
      ? path.join(__dirname, "views", "index.html")
      : // or if html and has `/` at the end, add the req.url to the file path and set
      contentType === "text/html" && req.url.slice(-1) === "/"
      ? path.join(__dirname, "views", req.url, "index.html")
      : // or if content type html, set value to req.url
      contentType === "text/html"
      ? path.join(__dirname, "views", req.url)
      : // else just set as req.url (application files like css, img, js)
        path.join(__dirname, req.url);

  // makes .html extension not required in the browser
  if (!extension && req.url.slice(-1) !== "/") filePath += ".html";

  // Now we have the `filePath` we can serve the file >>>>>>>>>>>>>>>>>>
  const fileExists = fs.existsSync(filePath);

  if (fileExists) {
    // serve all normal files
    serveFile(filePath, contentType, res);
  } else {
    switch (path.parse(filePath).base) {
      // Handle redirects
      case "old-page.html":
        res.writeHead(301, { Location: "/new-page.html" });
        res.end();
        break;
      case "www-page.html":
        res.writeHead(301, { Location: "/" });
        res.end();
        break;
      default:
        // Handle when path does not exist
        serveFile(path.join(__dirname, "views", "404.html"), "text/html", res);
    }
  }
});

// Initialise server
server.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
