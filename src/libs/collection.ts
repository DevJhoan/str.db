/**
 * The element will be used in collections.
 */
export declare type Element = object;

/**
 * The condition to to compare elements.
 * @template E the type of elements.
 * @template I the type of id.
 * @param el the element.
 * @returns whether the element matches the condition.
 */
export declare type Condition<E extends Element> = (el: Readonly<E>) => boolean;

/**
 * The comparator to compare two elements, the id won't be omitted.
 * @param first the first id.
 * @param second the second id.
 * @returns the comparing result.
 */
export declare type Comparator<E extends Element> = (
  first: Partial<E>,
  second: Partial<E>
) => number;

/**
 * The function to save the collection.
 * @param name the name of the collection.
 * @param elements the getter of elements to be saved in JSON file.
 */
export declare type Save = (name: string, elements: any[]) => Promise<void>;

/**
 * The options when creating a collection.
 * @template E the type of elements.
 * @template I the type of id.
 */
export interface InternalCollectionOptions<E extends Element> {
  /**
   * The name of collection.
   */
  name: string;
  /**
   * The comparator to compare the elements.
   */
  comparator?: Comparator<E>;
  /**
   * The elements of the collection.
   */
  elements: E[];
  /**
   * To save the collection.
   */
  save: Save;
  /**
   * The primary key.
   */
  primaryKey: keyof E;
}

/**
 * A collection is like an array.
 * You can insert, update, delete and find elements in it.
 *
 * When you apply methods affecting the collection,
 * it will start a debounced saver.
 *
 * Using `Array.from(collection)`, `[...collection]`,
 * or `for (const element of collection)` is also good practice.
 *
 * @template E the type of elements.
 * @template I the type of id.
 */
export class Collection<E extends Element> {
  private readonly comparator: Comparator<E>;
  private readonly name: string;
  private readonly save: Save;
  private readonly primaryKey: keyof E;
  private readonly elements: E[];

  constructor(options: InternalCollectionOptions<E>) {
    this.comparator = options.comparator || this.defaultComparator;
    this.elements = options.elements.sort(this.comparator);
    this.primaryKey = options.primaryKey;
    this.save = options.save;
    this.name = options.name;
  }

  private defaultComparator = (a: Partial<E>, b: Partial<E>): number => {
    if (a[this.primaryKey] < b[this.primaryKey]) return -1;
    if (a[this.primaryKey] > b[this.primaryKey]) return 1;
    return 0;
  };

  protected async startSaving(): Promise<void> {
    await this.save(this.name, this.elements);
  }

  /**
   * Get all elements that match the condition.
   * @param cond the condition to test.
   * @returns the elements that match the condition.
   */
  findAll(cond?: Condition<E>): readonly E[] {
    if (!cond) return this.elements;

    const result: E[] = [];

    for (const el of this) {
      if (cond(el)) result.push(el);
    }

    return result;
  }

  /**
   * Remove all elements that match the condition.
   * @param cond the condition to test.
   * @returns the number of removed elements.
   */
  removeAll(cond?: Condition<E>): number {
    let length = 0;

    for (const el of this) {
      if (!cond) {
        length++;
        this.remove(el);
      } else if (cond(el)) {
        length++;
        this.remove(el);
      }
    }

    return length;
  }

  /**
   * @returns the index to insert or get, and whether it has found the element.
   */
  private searchIndex(el: Partial<E>): [number, boolean] {
    if (!Reflect.has(el, this.primaryKey))
      throw new TypeError("cannot find the index without the primary key");
    let left = 0;
    let right = this.elements.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cmp = this.comparator(el, this.elements[mid]);
      if (cmp < 0) right = mid - 1;
      else if (cmp > 0) left = mid + 1;
      else return [mid, true];
    }

    return [left, false];
  }

  *[Symbol.iterator](): Iterator<Readonly<E>> {
    for (const el of this.elements) yield el;
  }

  /**
   * Insert an element in the collection.
   * If the element already exists, return false.
   * @param el the element to insert.
   * @returns true if the element is inserted.
   */
  async insert(el: E): Promise<boolean> {
    const [index, found] = this.searchIndex(el);
    if (found) return false;

    this.elements.splice(index, 0, el);
    await this.startSaving();

    return true;
  }

  /**
   * Update an element in the collection.
   * If the element doesn't exist, return false.
   * @param el the element to update.
   * @returns true if the element is updated.
   */
  async update(el: Partial<E>): Promise<boolean> {
    if (!Reflect.has(el, this.primaryKey))
      throw new TypeError("cannot update an element without the primary key");
    const [index, found] = this.searchIndex(el);
    if (!found) return false;

    // We need to change the found result.
    Object.assign(this.elements[index], el);
    await this.startSaving();

    return true;
  }

  /**
   * Remove an element in the collection.
   * If the element doesn't exist, return false.
   * @param el the element to remove.
   * @returns true if the element is removed.
   */
  async remove(el: Partial<E>): Promise<boolean> {
    // Removing elements won't make the array unsorted.
    const [index, found] = this.searchIndex(el);
    if (!found) return false;

    this.elements.splice(index, 1);
    await this.startSaving();

    return true;
  }

  has(arg: Partial<E> | Condition<E>): boolean {
    if (typeof arg === "function") return this.elements.find(arg) !== undefined;
    return this.find(arg) !== undefined;
  }

  find(el: Partial<E>): Readonly<E> | undefined {
    const [index, found] = this.searchIndex(el);
    if (!found) return undefined;
    return this.elements[index];
  }
}
