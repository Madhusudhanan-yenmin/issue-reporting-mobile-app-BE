import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Issue } from '../../issues/entities/issue.entity';
import { User } from '../../users/entities/user.entity';

@Entity('activitylog')
export class ActivityLog {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  @Column({ type: 'varchar', length: 24 })
  issueId: string;

  @Column()
  action: string;

  @Column({ type: 'varchar', length: 24 })
  performedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Issue, (issue) => issue.activities)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;

  @ManyToOne(() => User, (user) => user.activities)
  @JoinColumn({ name: 'performedBy' })
  user: User;
}
