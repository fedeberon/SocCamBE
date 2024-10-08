import User from '../models/user.model';
import { ICRUDService } from './ICRUDService';

export interface IUserService extends ICRUDService<User> {
  getByEmail(email: string): Promise<User | null>;
}
