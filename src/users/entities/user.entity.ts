import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { Issue } from '../../issues/entities/issue.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { ActivityLog } from '../../activities/entities/activity-log.entity';

@Entity('user')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  mobile: string;

  @Column({ select: false })
  password?: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ nullable: true })
  district?: string;

  @Column({ nullable: true })
  officerRole?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Issue, (issue) => issue.user)
  issuesCreated: Issue[];

  @OneToMany(() => Issue, (issue) => issue.officer)
  issuesAssigned: Issue[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => ActivityLog, (activity) => activity.user)
  activities: ActivityLog[];
}
