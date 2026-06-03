import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IssuesModule } from './issues/issues.module';
import { CommentsModule } from './comments/comments.module';
import { ActivitiesModule } from './activities/activities.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    // Configure global config module
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configure asynchronous mongoose module
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/issue-reporting',
      }),
      inject: [ConfigService],
    }),
    
    // Feature Modules
    AuthModule,
    UsersModule,
    IssuesModule,
    CommentsModule,
    ActivitiesModule,
    FeedbacksModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
