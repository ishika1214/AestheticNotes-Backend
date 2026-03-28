import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  user: mongoose.Types.ObjectId;
  messages: IMessage[];
  updated_at: Date;
}

const ConversationSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'model'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }
  ],
}, {
  timestamps: { updatedAt: 'updated_at' }
});

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
