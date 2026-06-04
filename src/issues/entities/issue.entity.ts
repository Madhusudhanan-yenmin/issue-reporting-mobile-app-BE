import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Category } from '../../common/enums/category.enum';
import { Priority } from '../../common/enums/priority.enum';
import { Status } from '../../common/enums/status.enum';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { ActivityLog } from '../../activities/entities/activity-log.entity';
import { Feedback } from '../../feedbacks/entities/feedback.entity';

@Entity('issue')
export class Issue {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  @Column({ unique: true })
  ticketId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: Category })
  category: Category;

  @Column({ type: 'enum', enum: Priority })
  priority: Priority;

  @Column({ type: 'enum', enum: Status, default: Status.OPEN })
  status: Status;

  @Column()
  location: string;

  @Column({ type: 'json' })
  images: string[];

  @Column({ type: 'varchar', length: 24 })
  userId: string;

  @Column({ type: 'varchar', length: 24, nullable: true })
  officerId: string | null;

  @Column({ default: '' })
  resolutionNotes: string;

  @Column({ type: 'json' })
  resolutionImages: string[];

  @Column({ default: '' })
  voiceUrl: string;

  @Column({ default: '' })
  videoUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.issuesCreated)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (user) => user.issuesAssigned, { nullable: true })
  @JoinColumn({ name: 'officerId' })
  officer: User | null;

  @OneToMany(() => Comment, (comment) => comment.issue)
  comments: Comment[];

  @OneToMany(() => ActivityLog, (activity) => activity.issue)
  activities: ActivityLog[];

  @OneToOne(() => Feedback, (feedback) => feedback.issue)
  feedback: Feedback;
}
