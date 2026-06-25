import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Issue } from '../issues/entities/issue.entity';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Issue]),
    ActivitiesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
