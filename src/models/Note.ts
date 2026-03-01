import mongoose, { Schema, Document } from 'mongoose';

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
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model<INote>('Note', NoteSchema);
