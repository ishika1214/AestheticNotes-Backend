import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  user: mongoose.Types.ObjectId;
  note: mongoose.Types.ObjectId;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  created_at: Date;
}

const FileSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: Schema.Types.ObjectId, ref: 'Note', required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export default mongoose.model<IFile>('File', FileSchema);
