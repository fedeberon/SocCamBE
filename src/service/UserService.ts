import { IUserService } from '../interfaces/IUserService';
import User from '../models/user.model';

export class UserService implements IUserService {
  async create(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const user = User.create(data);
    return user;
  }
  async getById(id: number): Promise<User | null> {
    const user = User.findByPk(id);
    return user;
  }
  async getAll(): Promise<User[]> {
    const users = User.findAll();
    return users;
  }
  async update(id: number, data: User): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) {
      return Promise.resolve(null);
    }
    return user.update(data);
  }
  async delete(id: number): Promise<boolean> {
    const deleted = User.destroy({
      where: { id: id },
    });
    return deleted;
  }
  async getByEmail(email: string): Promise<User | null> {
    const user = User.findOne({ where: { email } });
    if (!user) {
      return Promise.resolve(null);
    }
    return user;
  }
}
