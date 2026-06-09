import { 
  BadRequestException, 
  ForbiddenException, 
  Injectable, 
  NotFoundException, 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { Counter } from './entities/counter.entity';
import { Role } from '../common/enums/role.enum';
import { Status } from '../common/enums/status.enum';
import { Category } from '../common/enums/category.enum';
import { Priority } from '../common/enums/priority.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import * as crypto from 'crypto';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Counter)
    private readonly counterRepository: Repository<Counter>,
    private readonly entityManager: EntityManager,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  private mapIssue(issue: any): any {
    if (!issue) return issue;
    const { user, officer, ...rest } = issue;
    return {
      ...rest,
      userId: user ? { ...user, _id: user.id } : null,
      officerId: officer ? { ...officer, _id: officer.id } : null,
    };
  }

  async generateTicketId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    let seq = 1;

    // Use transaction with pessimistic write-lock for atomic sequence generation
    await this.entityManager.transaction(async (manager) => {
      let counter = await manager
        .createQueryBuilder(Counter, 'counter')
        .setLock('pessimistic_write')
        .where('counter.name = :name', { name: 'issue' })
        .getOne();

      if (!counter) {
        counter = manager.create(Counter, { name: 'issue', seq: 1 });
        await manager.save(Counter, counter);
        seq = 1;
      } else {
        counter.seq += 1;
        await manager.save(Counter, counter);
        seq = counter.seq;
      }
    });

    const sequenceStr = String(seq).padStart(4, '0');
    return `ISS-${currentYear}-${sequenceStr}`;
  }

  async create(createIssueDto: CreateIssueDto, userId: string): Promise<any> {
    const ticketId = await this.generateTicketId();
    const id = crypto.randomBytes(12).toString('hex');
    
    const newIssue = this.issueRepository.create({
      id,
      ticketId,
      title: createIssueDto.title,
      description: createIssueDto.description,
      category: createIssueDto.category,
      priority: createIssueDto.priority,
      status: Status.OPEN,
      district: createIssueDto.district,
      town: createIssueDto.town,
      address: createIssueDto.address,
      latitude: createIssueDto.latitude,
      longitude: createIssueDto.longitude,
      location: createIssueDto.location || `${createIssueDto.address}, ${createIssueDto.town}, ${createIssueDto.district}`,
      images: createIssueDto.images || [],
      userId,
      resolutionImages: [],
      voiceUrl: createIssueDto.voiceUrl || '',
      videoUrl: createIssueDto.videoUrl || '',
    });

    const savedIssue = await this.issueRepository.save(newIssue);
    
    // Log activity: Issue Created
    await this.activitiesService.logActivity(
      savedIssue.id,
      'Issue Created',
      userId,
    );

    // Fetch with populated user relations to return complete details
    const issueWithRelations = await this.issueRepository.findOne({
      where: { id: savedIssue.id },
      relations: { user: true, officer: true },
    });

    return this.mapIssue(issueWithRelations);
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
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(queryParams.page) || 1);
    const limit = Math.max(1, Number(queryParams.limit) || 10);
    const skip = (page - 1) * limit;

    const query = this.issueRepository.createQueryBuilder('issue')
      .leftJoinAndSelect('issue.user', 'user')
      .leftJoinAndSelect('issue.officer', 'officer')
      .orderBy('issue.createdAt', 'DESC');

    if (queryParams.search) {
      query.andWhere(
        '(issue.ticketId LIKE :search OR issue.title LIKE :search OR issue.description LIKE :search)',
        { search: `%${queryParams.search}%` }
      );
    }

    if (queryParams.status) {
      query.andWhere('issue.status = :status', { status: queryParams.status });
    }

    if (queryParams.category) {
      query.andWhere('issue.category = :category', { category: queryParams.category as Category });
    }

    // RBAC: USER views own, OFFICER views assigned, ADMIN views all
    if (user.role === Role.USER) {
      query.andWhere('issue.userId = :userId', { userId: user.id });
    } else if (user.role === Role.OFFICER) {
      query.andWhere('issue.officerId = :officerId', { officerId: user.id });
    }

    const total = await query.getCount();
    const data = await query.skip(skip).take(limit).getMany();

    return {
      data: data.map((issue) => this.mapIssue(issue)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, user: User): Promise<any> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: { user: true, officer: true, feedback: true },
    });

    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    // RBAC: Check authorization to view details
    if (user.role === Role.USER && issue.userId !== user.id) {
      throw new ForbiddenException('You do not have access to view this issue');
    }

    if (user.role === Role.OFFICER && issue.officerId !== user.id) {
      throw new ForbiddenException('You do not have access to view this issue');
    }

    return this.mapIssue(issue);
  }

  async assignOfficer(id: string, officerId: string, adminId: string): Promise<any> {
    const officer = await this.usersService.findOneById(officerId);
    if (!officer || officer.role !== Role.OFFICER) {
      throw new BadRequestException('Target user is not an Officer');
    }

    const issue = await this.issueRepository.findOne({
      where: { id },
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    await this.issueRepository.update(id, {
      officerId,
      status: Status.ASSIGNED,
    });

    const updatedIssue = await this.issueRepository.findOne({
      where: { id },
      relations: { user: true, officer: true },
    });

    // Log activity: Assigned To Officer
    await this.activitiesService.logActivity(
      updatedIssue!.id,
      `Assigned To Officer: ${officer.name}`,
      adminId,
    );

    return this.mapIssue(updatedIssue);
  }

  async updatePriority(id: string, updatePriorityDto: UpdatePriorityDto, adminId: string): Promise<any> {
    const issue = await this.issueRepository.findOne({
      where: { id },
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    const oldPriority = issue.priority;
    await this.issueRepository.update(id, {
      priority: updatePriorityDto.priority,
    });

    const updatedIssue = await this.issueRepository.findOne({
      where: { id },
      relations: { user: true, officer: true },
    });

    // Log activity
    await this.activitiesService.logActivity(
      updatedIssue!.id,
      `Priority updated from ${oldPriority} to ${updatePriorityDto.priority}`,
      adminId,
    );

    return this.mapIssue(updatedIssue);
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, user: User): Promise<any> {
    const issue = await this.issueRepository.findOne({
      where: { id },
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }

    const currentStatus = issue.status;
    const targetStatus = updateStatusDto.status;

    // RBAC: Verify if the user is allowed to initiate status updates
    if (user.role === Role.USER && issue.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this issue status');
    }

    if (user.role === Role.OFFICER && issue.officerId !== user.id) {
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

    const updateData: any = {
      status: targetStatus,
    };

    if (targetStatus === Status.RESOLVED) {
      updateData.resolutionNotes = updateStatusDto.resolutionNotes;
      updateData.resolutionImages = updateStatusDto.resolutionImages;
    }

    await this.issueRepository.update(id, updateData);

    const updatedIssue = await this.issueRepository.findOne({
      where: { id },
      relations: { user: true, officer: true },
    });

    // Log Activity: Status update
    let actionText = `Status updated to ${targetStatus}`;
    if (targetStatus === Status.IN_PROGRESS) actionText = 'Work Started';
    else if (targetStatus === Status.RESOLVED) actionText = 'Issue Resolved';
    else if (targetStatus === Status.CLOSED) actionText = 'Issue Closed';
    else if (targetStatus === Status.REOPENED) actionText = 'Issue Reopened';

    await this.activitiesService.logActivity(
      updatedIssue!.id,
      actionText,
      user.id,
    );

    return this.mapIssue(updatedIssue);
  }

  async findActivities(id: string, user: User) {
    // Validate issue visibility
    await this.findOne(id, user);
    return this.activitiesService.findByIssueId(id);
  }
}
