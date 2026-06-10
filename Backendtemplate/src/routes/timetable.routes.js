import express from 'express';
import { getTimetable, substituteTeacher, addTimetable } from '../controllers/timetablecontroller/timetablecontroller.js';

const router = express.Router();

router.post('/add', addTimetable);
router.post('/addTimetable', addTimetable);   // alias used by frontend
router.get('/getTimetable', getTimetable);
router.put('/substituteTeacher', substituteTeacher);

export default router;