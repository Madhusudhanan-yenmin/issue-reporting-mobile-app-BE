import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { Issue, IssueSchema } from './schemas/issue.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Issue.name, schema: IssueSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    UsersModule,
    ActivitiesModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService, MongooseModule],
})
export class IssuesModule {}
