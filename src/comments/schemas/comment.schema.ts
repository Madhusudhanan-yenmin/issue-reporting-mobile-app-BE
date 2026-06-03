import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Issue', required: true })
  issueId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  message: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
