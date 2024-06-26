# str.db

A simple JSON database for TypeScript projects.

## Features

- Pure TypeScript, helping you make fewer mistakes about types.
- Whenever you change the collection, it will start a debounced timer.
- Uses binary-search to maintain the data, meaning the best time complexity would be O(log n).
- Zero-deps, this project is not dependent on any other package.

# Usage

First, download it by `bun` (or `npm`, `yarn`, etc.).

```bash
bun install str.db
```

And then use it in your project like this:

```typescript
import { connect } from "json-file-database";

/**
 * The type of elements must have an `id` property
 * to make them unique and sorted in the collection.
 */
type User = { id: number; name: string };

/**
 * Connect to the database.
 * If there is no specified file yet, it will create one after running this program.
 */
const db = connect({
  file: "./db.json",
  init: {
    users: [
      { id: 1, name: "San Zhang" },
      { id: 2, name: "Si Li" },
      { id: 3, name: "Wu Wang" },
    ],
  },
});

/**
 * Specify the type of element as `User`.
 *
 * You can go to the documentation to see how to customize all
 * options, including the `comparator` to compare the elements.
 */
const users = db<User>({
  name: "users",
  primaryKey: "id",
});

/**
 * Find the element with its id.
 */
console.log("The user whose id is 1 is:", users.find({ id: 1 }));

/**
 * Find all elements that match given condition.
 */
console.log(
  "All users whose id <= 2 are:",
  users.findAll((u) => u.id <= 2)
);

/**
 * Check whether this collection has the element.
 */
console.log(
  "Whether the collection has a user whose id is 5:",
  users.has({ id: 5 })
);

/**
 * Insert an element and return whether it has been inserted.
 */
console.log(
  "Insert a user whose id is 2:",
  users.insert({ id: 2, name: "Liu Zhao" })
);

/**
 * List all elements.
 *
 * You can also use `[...users]` or `for...of` because
 * it has implemented Iterable.
 */
console.log("All users are:", Array.from(users));

/**
 * Remove the element and return whether it has been removed.
 */
console.log("Remove the user whose id is 1:", users.remove({ id: 1 }));

/**
 * Remove all elements that match the condition, and return the number of them.
 */
console.log(
  "Remove all users whose id < 3, the number of them is:",
  users.removeAll((u) => u.id < 3)
);

/**
 * Update the element with id, and return whether it has been updated.
 */
console.log(
  "Update the user whose id is 3:",
  users.update({ id: 3, name: "Liu Zhao" })
);
```

The first time you run it, it will create a new file `db.json` and all outputs are expected. However, when you try to run it again, the outputs are not the same.

This is because if there is no file, it will use the `init` property when you try to connect the database; otherwise it will read it directly.

## Credits

- [hikariyo](https://www.npmjs.com/~hikariyo)
