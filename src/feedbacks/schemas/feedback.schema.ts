import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Feedback extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Issue', required: true, unique: true })
  issueId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, trim: true })
  comment: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
