import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepository: Repository<ActivityLog>,
  ) {}

  async logActivity(issueId: string, action: string, performedBy: string): Promise<ActivityLog> {
    const id = crypto.randomBytes(12).toString('hex');
    const newActivity = this.activityRepository.create({
      id,
      issueId,
      action,
      performedBy,
    });
    return this.activityRepository.save(newActivity);
  }

  async findByIssueId(issueId: string): Promise<any[]> {
    const logs = await this.activityRepository.find({
      where: { issueId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return logs.map((log) => {
      const { user, ...rest } = log;
      return {
        ...rest,
        performedBy: user ? { ...user, _id: user.id } : null,
      };
    });
  }
}
