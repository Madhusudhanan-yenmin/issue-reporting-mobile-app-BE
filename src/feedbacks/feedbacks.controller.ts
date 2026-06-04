import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeedbacksService } from './feedbacks.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { mapDbResponse } from '../common/utils/db-mapper';

@ApiTags('Feedbacks Management')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Post()
  @ApiOperation({ summary: 'Submit feedback for a closed issue (Only creator of the issue can submit)' })
  @ApiResponse({ status: 201, description: 'Feedback successfully submitted' })
  @ApiResponse({ status: 400, description: 'Validation error or issue is not CLOSED' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not the issue creator)' })
  @ApiResponse({ status: 409, description: 'Feedback already exists' })
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @GetUser() user: any,
  ) {
    const data = await this.feedbacksService.create(createFeedbackDto, user);
    return mapDbResponse(data);
  }

  @Get(':issueId')
  @ApiOperation({ summary: 'Get feedback for a specific issue' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid issue ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (no access to issue)' })
  async findByIssueId(
    @Param('issueId') issueId: string,
    @GetUser() user: any,
  ) {
    const data = await this.feedbacksService.findByIssueId(issueId, user);
    return mapDbResponse(data);
  }
}
