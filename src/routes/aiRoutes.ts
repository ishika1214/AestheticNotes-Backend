import express from 'express';
import { 
  summarize, 
  generateTitle, 
  generateTags, 
  formatNote, 
  rewrite, 
  extractTasks, 
  extractReminders, 
  generateDiagram,
  chat,
  getHistory,
  clearHistory
} from '../controllers/aiController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.post('/summarize', summarize);
router.post('/generate-title', generateTitle);
router.post('/generate-tags', generateTags);
router.post('/format', formatNote);
router.post('/rewrite', rewrite);
router.post('/extract-tasks', extractTasks);
router.post('/extract-reminders', extractReminders);
router.post('/diagram', generateDiagram);
router.post('/chat', chat);
router.get('/history', getHistory);
router.delete('/history', clearHistory);

export default router;
