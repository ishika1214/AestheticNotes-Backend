import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Note from '../models/Note';
import Conversation from '../models/Conversation';
import * as aiService from '../services/aiService';

export const summarize = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const result = await aiService.summarizeNote(content);
    res.json({ result });
  } catch (err) {
    console.error("summarize error:", err);
    res.status(500).json({ message: 'AI Summarization error' });
  }
};

export const generateTitle = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const result = await aiService.generateTitle(content);
    res.json({ result });
  } catch (err) {
    console.error("generateTitle error:", err);
    res.status(500).json({ message: 'AI Title Generation error' });
  }
};

export const generateTags = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const result = await aiService.generateTags(content);
    res.json({ result });
  } catch (err) {
    console.error("generateTags error:", err);
    res.status(500).json({ message: 'AI Tag Generation error' });
  }
};

export const formatNote = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const result = await aiService.cleanupFormatting(content);
    res.json({ result });
  } catch (err) {
    console.error("formatNote error:", err);
    res.status(500).json({ message: 'AI Formatting error' });
  }
};

export const rewrite = async (req: AuthRequest, res: Response) => {
  try {
    const { content, mode } = req.body;
    if (!content || !mode) return res.status(400).json({ message: 'Content and mode are required' });

    const result = await aiService.rewriteNote(content, mode);
    res.json({ result });
  } catch (err) {
    console.error("rewrite error:", err);
    res.status(500).json({ message: 'AI Rewrite error' });
  }
};

export const extractTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const result = await aiService.extractTasks(content);
    res.json({ result });
  } catch (err) {
    console.error("extractTasks error:", err);
    res.status(500).json({ message: 'AI Task Extraction error' });
  }
};

export const extractReminders = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const result = await aiService.extractReminders(content);
    res.json({ result: JSON.parse(result) });
  } catch (err) {
    console.error("extractReminders error:", err);
    res.status(500).json({ message: 'AI Reminder Extraction error' });
  }
};

export const generateDiagram = async (req: AuthRequest, res: Response) => {
  try {
    const { content, type } = req.body; // type: flowchart, sequence, etc.
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const result = await aiService.generateDiagram(content, type);
    res.json({ result });
  } catch (err) {
    console.error("generateDiagram error:", err);
    res.status(500).json({ message: 'AI Diagram error' });
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const chat = await Conversation.findOne({ user: req.user?.id });
    res.json({ history: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: 'History fetch error' });
  }
};

export const clearHistory = async (req: AuthRequest, res: Response) => {
  try {
    await Conversation.findOneAndUpdate(
      { user: req.user?.id },
      { messages: [] },
      { upsert: true }
    );
    res.json({ message: 'Chat cleared' });
  } catch (err) {
    res.status(500).json({ message: 'History clear error' });
  }
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'Query is required' });

    // 1. Get History
    let conv = await Conversation.findOne({ user: req.user?.id });
    if (!conv) {
      conv = new Conversation({ user: req.user?.id, messages: [] });
    }

    // 2. Retrieval (RAG)
    const queryEmbedding = await aiService.generateEmbedding(query);
    const allNotes = await Note.find({ user: req.user?.id });
    
    // Sort by cosine similarity and take top 5
    const contextNotes = allNotes
      .map(note => ({
        title: note.title,
        content: note.content,
        similarity: note.embedding?.length > 0 ? aiService.cosineSimilarity(queryEmbedding, note.embedding) : 0
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .filter(n => n.similarity > 0.5); // Only notes that somewhat match

    // 3. AI Call
    const aiResponse = await aiService.chatWithNotes(query, (conv.messages as any), contextNotes);

    // 4. Update History
    conv.messages.push({ role: 'user', content: query, timestamp: new Date() });
    conv.messages.push({ role: 'model', content: aiResponse, timestamp: new Date() });
    
    // Keep last 50 messages to avoid huge docs
    if (conv.messages.length > 50) {
      conv.messages = conv.messages.slice(-50);
    }
    
    await conv.save();

    res.json({ response: aiResponse });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ message: 'AI Chat error' });
  }
};
