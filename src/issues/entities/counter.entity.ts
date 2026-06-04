import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('counter')
export class Counter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ default: 0 })
  seq: number;
}
