# NPM Modules

Initialise a node project to create a `package.json` file:

```js
npm init
```

Once the first package is added to the project and a `node_modules` folder is created, create a `.gitignore` file, add the `node_modules` folder.
This will prevent the `node_modules` folder from being added to any code pushes. These dependencies are added to the `package.json` file though so can be installed via `npm i`.

---

## Creating dev Dependencies and Scripts

Create a script to run nodemon as a dev dependency:

1. Add nodemon to `package.json` dev dependencies:

```
npm i nodemon -D
```

2. Add a `script` to `package.json` so we can initialise the `nodemon` server with a custom command `npm run dev`:

**package.json**:

```js
 "scripts": {
    "start": "node index",
    "dev": "nodemon index"
  },
``
```

---

## Adding unique ID package

```
npm i uuid
```

The we can use the the package:

```js
const { format } = require("date-fns");
const { v4: uuid } = require("uuid");

const date = format(new Date(), "yyyyMMdd\tHH:mm:ss");

console.log(date);
console.log(uuid());
```

Each invocation wil return a unique id:

```
aaac7c74-7386-4afd-b005-244402e89a01

```

---

## Remove package

```
npm rm packageName
```

If the package is a dev dependency we need to add the `-D` flag:

```
npm rm packageName -D
```

## Install specific version

```
npm i packageName@5.3.1
```

## Update all packages

```
npm update
```
