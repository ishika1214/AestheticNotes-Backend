import express from 'express';
import { getNotes, createNote, updateNote, deleteNote, getTags } from '../controllers/noteController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getNotes);
router.get('/tags', getTags);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
