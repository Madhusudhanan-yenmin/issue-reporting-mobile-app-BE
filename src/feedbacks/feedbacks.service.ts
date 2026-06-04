import { 
  BadRequestException, 
  ConflictException, 
  ForbiddenException, 
  Injectable 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { IssuesService } from '../issues/issues.service';
import { Status } from '../common/enums/status.enum';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    private readonly issuesService: IssuesService,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto, user: User): Promise<Feedback> {
    const { issueId, rating, comment } = createFeedbackDto;

    // Retrieve issue details (validates issue existence and permissions)
    const issue = await this.issuesService.findOne(issueId, user);

    // Enforce role policies:
    // Only the creator can submit feedback
    const creatorId = issue.userId && typeof issue.userId === 'object' 
      ? (issue.userId._id || issue.userId.id) 
      : issue.userId;

    if (creatorId.toString() !== user.id.toString()) {
      throw new ForbiddenException('Only the creator of the issue can submit feedback');
    }

    // Only CLOSED issues can receive feedback
    if (issue.status !== Status.CLOSED) {
      throw new BadRequestException('Feedback can only be submitted for CLOSED issues');
    }

    // Check if feedback already exists
    const existingFeedback = await this.feedbackRepository.findOne({
      where: { issueId },
    });
    if (existingFeedback) {
      throw new ConflictException('Feedback has already been submitted for this issue');
    }

    const id = crypto.randomBytes(12).toString('hex');
    const newFeedback = this.feedbackRepository.create({
      id,
      issueId,
      rating,
      comment,
    });

    return this.feedbackRepository.save(newFeedback);
  }

  async findByIssueId(issueId: string, user: User): Promise<Feedback | null> {
    // Validate visibility
    await this.issuesService.findOne(issueId, user);

    return this.feedbackRepository.findOne({
      where: { issueId },
    });
  }
}
