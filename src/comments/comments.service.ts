import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { IssuesService } from '../issues/issues.service';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly issuesService: IssuesService,
  ) {}

  private mapComment(comment: any): any {
    if (!comment) return comment;
    const { user, ...rest } = comment;
    return {
      ...rest,
      userId: user ? { ...user, _id: user.id } : null,
    };
  }

  async create(createCommentDto: CreateCommentDto, user: User): Promise<any> {
    const { issueId, message } = createCommentDto;

    // Check if issue exists and user has rights to view it (verifies access implicitly)
    await this.issuesService.findOne(issueId, user);

    const id = crypto.randomBytes(12).toString('hex');
    const newComment = this.commentRepository.create({
      id,
      issueId,
      userId: user.id,
      message,
    });

    const savedComment = await this.commentRepository.save(newComment);
    
    // Fetch with populated user relations to return complete details
    const commentWithRelations = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: { user: true },
    });

    return this.mapComment(commentWithRelations);
  }

  async findByIssueId(issueId: string, user: User): Promise<any[]> {
    // Verify issue access
    await this.issuesService.findOne(issueId, user);

    const comments = await this.commentRepository.find({
      where: { issueId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return comments.map((comment) => this.mapComment(comment));
  }
}
