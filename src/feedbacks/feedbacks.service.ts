import { 
  BadRequestException, 
  ConflictException, 
  ForbiddenException, 
  Injectable 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback } from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { IssuesService } from '../issues/issues.service';
import { Status } from '../common/enums/status.enum';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<Feedback>,
    private readonly issuesService: IssuesService,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto, user: User): Promise<Feedback> {
    const { issueId, rating, comment } = createFeedbackDto;

    // Retrieve issue details (validates issue existence and permissions)
    const issue = await this.issuesService.findOne(issueId, user);

    // Enforce role policies:
    // Only the creator can submit feedback
    if (issue.userId._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('Only the creator of the issue can submit feedback');
    }

    // Only CLOSED issues can receive feedback
    if (issue.status !== Status.CLOSED) {
      throw new BadRequestException('Feedback can only be submitted for CLOSED issues');
    }

    // Check if feedback already exists
    const existingFeedback = await this.feedbackModel.findOne({ issueId: new Types.ObjectId(issueId) }).exec();
    if (existingFeedback) {
      throw new ConflictException('Feedback has already been submitted for this issue');
    }

    const newFeedback = new this.feedbackModel({
      issueId: new Types.ObjectId(issueId),
      rating,
      comment,
    });

    return newFeedback.save();
  }

  async findByIssueId(issueId: string, user: User): Promise<Feedback | null> {
    if (!Types.ObjectId.isValid(issueId)) {
      throw new BadRequestException('Invalid issue ID format');
    }

    // Validate visibility
    await this.issuesService.findOne(issueId, user);

    return this.feedbackModel.findOne({ issueId: new Types.ObjectId(issueId) }).exec();
  }
}
