import { createFile, type DatabaseFile } from "./database-file";
import type { Comparator, Element } from "./collection";
import { Collection } from "./collection";

/**
 * Options to create a collection.
 * @template E the type of element.
 */
export interface CollectionOptions<E extends Element> {
  /**
   * The name of the collection.
   */
  name: string;
  /**
   * The primary key.
   */
  primaryKey: keyof E;
  /**
   * The comparator to compare the elements.
   * It will compare elements using built-in operators by default.
   */
  comparator?: Comparator<E>;
}

/**
 * What the Database will operate. It must contain array-typed values.
 */
export interface JSONData {
  [key: string]: readonly any[];
}

/**
 * The options when creating a connection of database file.
 */
export interface DatabaseOptions {
  /**
   * The file to process.
   * If it is a string, it will be seen as a path to the file.
   */
  file: string | DatabaseFile;
  /**
   * The delay of each saving action.
   * @default 0
   */
  delay?: number;
  /**
   * If the database file does not exist,
   * it will create a new file with this object in it.
   * @default {}
   */
  init?: JSONData;
  /**
   * Save the json in a beautified version.
   * @default false
   */
  beautify?: boolean;
  /**
   * After the database file is saved,
   * this function will be called if it is not undefined.
   * @default ()=>{}
   */
  onSaved?: () => void;
}

/**
 * Creates a collection by full information.
 *
 * @template E the type of elements.
 * @param options the options to create the collection.
 * @returns the collection.
 */
export interface Database {
  <E extends Element>(options: CollectionOptions<E>): Collection<E>;
}

/**
 * Connects the database synchronously.
 * @param options the options for connection.
 * @returns the database.
 */
export function connect(options: DatabaseOptions): Database {
  const {
    file,
    delay = 0,
    init = {},
    beautify = false,
    onSaved = () => {},
  } = options;

  let databaseFile: DatabaseFile;
  if (typeof file === "string") {
    databaseFile = createFile(file);
  } else {
    databaseFile = file;
  }

  let data: JSONData;
  try {
    data = JSON.parse(databaseFile.read());
  } catch (error) {
    data = init;
  }

  async function save(name: string, elements: any[]): Promise<void> {
    if (delay > 0) await wait(delay);

    data[name] = elements;
    await databaseFile.write(JSON.stringify(data, null, beautify ? 2 : 0));

    onSaved();
  }

  return (options) => {
    const { name, comparator, primaryKey } = options;
    const elements = data[name] || (data[name] = []);
    if (!Array.isArray(elements)) {
      throw new TypeError(`Property ${name} in the database is not an array.`);
    }

    return new Collection({ name, comparator, primaryKey, elements, save });
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
