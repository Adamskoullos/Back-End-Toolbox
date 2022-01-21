# Mongo

Data is stored in `collections` with individual records being called `documents`.

`Documents` have a key value structure.

Advantages over relational databases:

- Performance > very fast at querying collections
- Flexibility > able to add fields as needed
- Scalability > Able to support large databases and high request rates with low latencies

---

## Set Up

Create `project`, `database`, `user` and get api endpoint via Mongo UI. Then connect to a cluster to get the database uri. Then add the uri to the application:

1. Add the database uri to the `.env` file
2. Add the `.env` file to the top of `server.js` (then we don't need to pull this in within specific controller and verifyJWT files):

```js
require("dotenv").config();
```

3. Install Mongoose

```
npm i mongoose
```
