import { 
  BadRequestException, 
  ForbiddenException, 
  Injectable, 
  NotFoundException, 
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Issue } from './schemas/issue.schema';
import { Counter } from './schemas/counter.schema';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { Role } from '../common/enums/role.enum';
import { Status } from '../common/enums/status.enum';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class IssuesService {
  constructor(
    @InjectModel(Issue.name) private readonly issueModel: Model<Issue>,
    @InjectModel(Counter.name) private readonly counterModel: Model<Counter>,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async generateTicketId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'issue' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const sequenceStr = String(counter.seq).padStart(4, '0');
    return `ISS-${currentYear}-${sequenceStr}`;
  }

  async create(createIssueDto: CreateIssueDto, userId: string): Promise<Issue> {
    const ticketId = await this.generateTicketId();
    
    const newIssue = new this.issueModel({
      ...createIssueDto,
      ticketId,
      status: Status.OPEN,
      userId: new Types.ObjectId(userId),
    });

    const savedIssue = await newIssue.save();
    
    // Log activity: Issue Created
    await this.activitiesService.logActivity(
      savedIssue._id.toString(),
      'Issue Created',
      userId,
    );

    return savedIssue;
  }

  async findAll(
    queryParams: {
      page?: number;
      limit?: number;
      search?: string;
      status?: Status;
      category?: string;
    },
    user: User,
  ): Promise<{ data: Issue[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(queryParams.page) || 1);
    const limit = Math.max(1, Number(queryParams.limit) || 10);
    const skip = (page - 1) * limit;

    const filterQuery: any = {};

    // Search filter (ticketId, title, or description matching regex)
    if (queryParams.search) {
      filterQuery.$or = [
        { ticketId: { $regex: queryParams.search, $options: 'i' } },
        { title: { $regex: queryParams.search, $options: 'i' } },
        { description: { $regex: queryParams.search, $options: 'i' } },
      ];
    }

    // Status filter
    if (queryParams.status) {
      filterQuery.status = queryParams.status;
    }

    // Category filter
    if (queryParams.category) {
      filterQuery.category = queryParams.category;
    }

    // RBAC: USER views own, OFFICER views assigned, ADMIN views all
    if (user.role === Role.USER) {
      filterQuery.userId = user._id;
    } else if (user.role === Role.OFFICER) {
      filterQuery.officerId = user._id;
    }

    const total = await this.issueModel.countDocuments(filterQuery);
    const data = await this.issueModel
      .find(filterQuery)
      .populate('userId', 'name email mobile role')
      .populate('officerId', 'name email mobile role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, user: User): Promise<Issue> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid issue ID format');
    }

    const issue = await this.issueModel
      .findById(id)
      .populate('userId', 'name email mobile role')
      .populate('officerId', 'name email mobile role')
      .exec();

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    // RBAC: Check authorization to view details
    if (user.role === Role.USER && issue.userId._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not have access to view this issue');
    }

    if (user.role === Role.OFFICER && issue.officerId?._id.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not have access to view this issue');
    }

    return issue;
  }

  async assignOfficer(id: string, officerId: string, adminId: string): Promise<Issue> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(officerId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const officer = await this.usersService.findOneById(officerId);
    if (!officer || officer.role !== Role.OFFICER) {
      throw new BadRequestException('Target user is not an Officer');
    }

    const issue = await this.issueModel.findById(id).exec();
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    issue.officerId = new Types.ObjectId(officerId);
    issue.status = Status.ASSIGNED;

    const updatedIssue = await issue.save();

    // Log activity: Assigned To Officer
    await this.activitiesService.logActivity(
      updatedIssue._id.toString(),
      `Assigned To Officer: ${officer.name}`,
      adminId,
    );

    return updatedIssue;
  }

  async updatePriority(id: string, updatePriorityDto: UpdatePriorityDto, adminId: string): Promise<Issue> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid issue ID format');
    }

    const issue = await this.issueModel.findById(id).exec();
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    const oldPriority = issue.priority;
    issue.priority = updatePriorityDto.priority;
    const updatedIssue = await issue.save();

    // Log activity
    await this.activitiesService.logActivity(
      updatedIssue._id.toString(),
      `Priority updated from ${oldPriority} to ${updatePriorityDto.priority}`,
      adminId,
    );

    return updatedIssue;
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, user: User): Promise<Issue> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid issue ID format');
    }

    const issue = await this.issueModel.findById(id).exec();
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    const currentStatus = issue.status;
    const targetStatus = updateStatusDto.status;

    // RBAC: Verify if the user is allowed to initiate status updates
    if (user.role === Role.USER && issue.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You are not authorized to update this issue status');
    }

    if (user.role === Role.OFFICER && issue.officerId?.toString() !== user._id.toString()) {
      throw new ForbiddenException('You are not authorized to update this issue status');
    }

    // Validate Transitions
    // ASSIGNED -> IN_PROGRESS (Officer / Admin)
    if (targetStatus === Status.IN_PROGRESS) {
      if (currentStatus !== Status.ASSIGNED && currentStatus !== Status.REOPENED) {
        throw new BadRequestException(`Cannot transition status from ${currentStatus} to ${targetStatus}`);
      }
      if (user.role === Role.USER) {
        throw new ForbiddenException('Users cannot change status to IN_PROGRESS');
      }
    }

    // IN_PROGRESS -> RESOLVED (Officer / Admin)
    else if (targetStatus === Status.RESOLVED) {
      if (currentStatus !== Status.IN_PROGRESS) {
        throw new BadRequestException(`Cannot transition status from ${currentStatus} to ${targetStatus}`);
      }
      if (user.role === Role.USER) {
        throw new ForbiddenException('Users cannot change status to RESOLVED');
      }
      // Require resolution notes and images
      if (!updateStatusDto.resolutionNotes || updateStatusDto.resolutionNotes.trim() === '') {
        throw new BadRequestException('Resolution notes are required to resolve the issue');
      }
      if (!updateStatusDto.resolutionImages || updateStatusDto.resolutionImages.length === 0) {
        throw new BadRequestException('At least one resolution image is required to resolve the issue');
      }
      
      issue.resolutionNotes = updateStatusDto.resolutionNotes;
      issue.resolutionImages = updateStatusDto.resolutionImages;
    }

    // RESOLVED -> CLOSED (User / Admin)
    else if (targetStatus === Status.CLOSED) {
      if (currentStatus !== Status.RESOLVED) {
        throw new BadRequestException(`Cannot transition status from ${currentStatus} to ${targetStatus}`);
      }
      if (user.role === Role.OFFICER) {
        throw new ForbiddenException('Officers cannot close issues');
      }
    }

    // RESOLVED -> REOPENED (User / Admin)
    else if (targetStatus === Status.REOPENED) {
      if (currentStatus !== Status.RESOLVED) {
        throw new BadRequestException(`Cannot transition status from ${currentStatus} to ${targetStatus}`);
      }
      if (user.role === Role.OFFICER) {
        throw new ForbiddenException('Officers cannot reopen issues');
      }
    }
    
    else {
      // Any other arbitrary transition is invalid
      throw new BadRequestException(`Invalid status transition to ${targetStatus}`);
    }

    issue.status = targetStatus;
    const updatedIssue = await issue.save();

    // Log Activity: Status update
    let actionText = `Status updated to ${targetStatus}`;
    if (targetStatus === Status.IN_PROGRESS) actionText = 'Work Started';
    else if (targetStatus === Status.RESOLVED) actionText = 'Issue Resolved';
    else if (targetStatus === Status.CLOSED) actionText = 'Issue Closed';
    else if (targetStatus === Status.REOPENED) actionText = 'Issue Reopened';

    await this.activitiesService.logActivity(
      updatedIssue._id.toString(),
      actionText,
      user._id.toString(),
    );

    return updatedIssue;
  }

  async findActivities(id: string, user: User) {
    // Validate issue visibility
    await this.findOne(id, user);
    return this.activitiesService.findByIssueId(id);
  }
}
