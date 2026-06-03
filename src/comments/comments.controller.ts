import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('Comments Management')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a comment to an issue (Authorized roles with issue visibility only)' })
  @ApiResponse({ status: 201, description: 'Comment successfully added' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to issue)' })
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser() user: User,
  ) {
    return this.commentsService.create(createCommentDto, user);
  }

  @Get(':issueId')
  @ApiOperation({ summary: 'Get all comments for a specific issue' })
  @ApiResponse({ status: 200, description: 'Comments list retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid issue ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to issue)' })
  async findByIssueId(
    @Param('issueId') issueId: string,
    @GetUser() user: User,
  ) {
    return this.commentsService.findByIssueId(issueId, user);
  }
}
