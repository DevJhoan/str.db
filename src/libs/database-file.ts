import { writeFile } from "fs/promises";
import { readFileSync } from "fs";

/**
 * The file for the database to read.
 */
export interface DatabaseFile {
  /**
   * Reads the content of the file.
   * @returns the content.
   */
  read(): string;
  /**
   * Writes the content to the file.
   * @param content the content to be written.
   */
  write(content: string): Promise<void>;
}

/**
 * Creates a real file in the disk.
 * @param path the path of file.
 * @returns the file for the database to read.
 */
export function createFile(path: string): DatabaseFile {
  return {
    read() {
      return readFileSync(path, "utf-8");
    },
    async write(content: string): Promise<void> {
      await writeFile(path, content);
    },
  };
}
