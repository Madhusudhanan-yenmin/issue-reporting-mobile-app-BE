import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { IssuesService } from '../issues/issues.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    private readonly issuesService: IssuesService,
  ) {}

  async create(createCommentDto: CreateCommentDto, user: User): Promise<Comment> {
    const { issueId, message } = createCommentDto;

    // Check if issue exists and user has rights to view it (verifies access implicitly)
    await this.issuesService.findOne(issueId, user);

    const newComment = new this.commentModel({
      issueId: new Types.ObjectId(issueId),
      userId: user._id,
      message,
    });

    const savedComment = await newComment.save();
    return this.commentModel
      .findById(savedComment._id)
      .populate('userId', 'name role')
      .exec() as Promise<Comment>;
  }

  async findByIssueId(issueId: string, user: User): Promise<Comment[]> {
    if (!Types.ObjectId.isValid(issueId)) {
      throw new BadRequestException('Invalid issue ID format');
    }

    // Verify issue access
    await this.issuesService.findOne(issueId, user);

    return this.commentModel
      .find({ issueId: new Types.ObjectId(issueId) })
      .populate('userId', 'name role')
      .sort({ createdAt: 1 })
      .exec();
  }
}
