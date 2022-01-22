# Mongo and Mongoose Set-Up

Data is stored in `collections` with individual records being called `documents`.

`Documents` have a key value structure.

Advantages over relational databases:

- Performance > very fast at querying collections
- Flexibility > able to add fields as needed
- Scalability > Able to support large databases and high request rates with low latencies

---

## Set Up

Within Mongo Dashboard:

Create `project`, `database`, `user` and get api endpoint via Mongo UI. Then connect to a cluster to get the database uri. Then add the uri to the application:

1. Add the database uri to the `.env` file
2. Add the `.env` file to the top of `server.js` (then we don't need to pull this in within specific controller and verifyJWT files):

```js
require("dotenv").config();
```

3. Install Mongoose

Mongoose provides a neat interface with Mongo for working with schemas and undertaking database operations.

```
npm i mongoose
```

4. Add Mongoose to `server.js`:

```js
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3500;
```

5. Create a connection configuration `/config/dbConnection.js`

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
```

6. Pull `connectDB` into `server.js` and connect to database:

```js
const credentials = require("./middleware/credentials");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConnection");

const PORT = process.env.PORT || 3500;

// Connect to db
connectDB();
```

7. At the bottom of `server.js` do a check to make sure we are connected to the db before initializing the server:

```js
// Initialize server
mongoose.connection.once("open", () => {
  app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
});
```
