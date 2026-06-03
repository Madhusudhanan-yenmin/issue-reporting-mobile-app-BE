import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // We explicitly select password here for authentication verification
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findAllOfficers(): Promise<User[]> {
    return this.userModel.find({ role: Role.OFFICER }).exec();
  }

  async findAllUsersAndOfficers(): Promise<User[]> {
    return this.userModel.find({ role: { $in: [Role.USER, Role.OFFICER] } }).exec();
  }
}
