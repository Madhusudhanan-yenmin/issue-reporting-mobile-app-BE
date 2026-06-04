import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Issue } from '../../issues/entities/issue.entity';

@Entity('feedback')
export class Feedback {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  @Column({ type: 'varchar', length: 24, unique: true })
  issueId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Issue, (issue) => issue.feedback)
  @JoinColumn({ name: 'issueId' })
  issue: Issue;
}
