import mongoose, { Schema, Document } from 'mongoose';

export interface IReminder {
  text: string;
  date: Date;
}

export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  content: string;
  emoji: string;
  color: string;
  is_public: boolean;
  is_pinned: boolean;
  cover_image: string | null;
  tags: string[];
  embedding: number[];
  autoTitle: string;
  summary: string;
  voiceText: string;
  tasks: string[];
  reminders: IReminder[];
  created_at: Date;
  updated_at: Date;
}

const NoteSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled' },
  content: { type: String, default: '' },
  emoji: { type: String, default: '📝' },
  color: { type: String, default: 'bg-white dark:bg-stone-900' },
  is_public: { type: Boolean, default: false },
  is_pinned: { type: Boolean, default: false },
  cover_image: { type: String, default: null },
  tags: [{ type: String }],
  embedding: { type: [Number], default: [] },
  autoTitle: { type: String, default: "" },
  summary: { type: String, default: "" },
  voiceText: { type: String, default: "" },
  tasks: [{ type: String }],
  reminders: [
    {
      text: String,
      date: Date,
    }
  ],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// For Atlas Vector Search or similar capabilities
NoteSchema.index({ embedding: "vector" as any });

export default mongoose.model<INote>('Note', NoteSchema);
