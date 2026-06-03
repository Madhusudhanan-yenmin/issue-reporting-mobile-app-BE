import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity } from './schemas/activity.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
  ) {}

  async logActivity(issueId: string, action: string, performedBy: string): Promise<Activity> {
    const newActivity = new this.activityModel({
      issueId: new Types.ObjectId(issueId),
      action,
      performedBy: new Types.ObjectId(performedBy),
    });
    return newActivity.save();
  }

  async findByIssueId(issueId: string): Promise<Activity[]> {
    return this.activityModel
      .find({ issueId: new Types.ObjectId(issueId) })
      .populate('performedBy', 'name role')
      .sort({ createdAt: 1 })
      .exec();
  }
}
