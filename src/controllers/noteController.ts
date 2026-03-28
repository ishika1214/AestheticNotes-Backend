import { Response } from 'express';
import Note from '../models/Note';
import { AuthRequest } from '../middleware/auth';
import * as aiService from '../services/aiService';

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find({ user: req.user?.id }).sort({ is_pinned: -1, updated_at: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find({ user: req.user?.id });
    const tags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, emoji, color, is_public, is_pinned, cover_image, tags } = req.body;
    const note = new Note({
      user: req.user?.id,
      title,
      content,
      emoji,
      color,
      is_public,
      is_pinned,
      cover_image,
      tags
    });

    await note.save();
    res.status(201).json(note);

    // Generate embedding for RAG asynchronously
    const contentText = `${title || ''} ${content || ''}`;
    if (contentText.trim()) {
      try {
        const embedding = await aiService.generateEmbedding(contentText);
        if (embedding && embedding.length > 0) {
          note.embedding = embedding;
          await note.save();
        }
      } catch (e) {
        console.error("Embedding generation failed during create:", e);
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndUpdate(
      { _id: id, user: req.user?.id },
      { ...req.body, updated_at: Date.now() },
      { returnDocument: "after" }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });

    res.json(note);

    // Update embedding if title or content changed, doing so asynchronously
    if (req.body.title !== undefined || req.body.content !== undefined) {
      const contentText = `${note.title || ''} ${note.content || ''}`;
      try {
        const embedding = await aiService.generateEmbedding(contentText);
        if (embedding && embedding.length > 0) {
          note.embedding = embedding;
          await note.save();
        }
      } catch (e) {
        console.error("Embedding generation failed during update:", e);
      }
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndDelete({ _id: id, user: req.user?.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const bulkDeleteNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty IDs array' });
    }

    const result = await Note.deleteMany({
      _id: { $in: ids },
      user: req.user?.id
    });

    res.json({ message: `${result.deletedCount} notes deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
