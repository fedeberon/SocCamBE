export interface ICRUDService<T> {
  create(data: T): Promise<T>;
  getById(id: number): Promise<T | null>;
  getAll(): Promise<T[]>;
  update(id: number, data: T): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}
