import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from '../../common/enums/category.enum';
import { Priority } from '../../common/enums/priority.enum';
import { Status } from '../../common/enums/status.enum';

@Schema({ timestamps: true })
export class Issue extends Document {
  @Prop({ required: true, unique: true })
  ticketId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, enum: Category })
  category: Category;

  @Prop({ required: true, enum: Priority })
  priority: Priority;

  @Prop({ required: true, enum: Status, default: Status.OPEN })
  status: Status;

  @Prop({ required: true })
  location: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  officerId: Types.ObjectId;

  @Prop({ default: '' })
  resolutionNotes: string;

  @Prop({ type: [String], default: [] })
  resolutionImages: string[];
}

export const IssueSchema = SchemaFactory.createForClass(Issue);
