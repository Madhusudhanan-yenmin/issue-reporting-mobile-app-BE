import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Activity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Issue', required: true })
  issueId: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy: Types.ObjectId;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
