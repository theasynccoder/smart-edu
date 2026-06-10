// Re-seed timetable with className field (was missing from schema before)
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const CLASSES = ['10A', '10B', '9A', '9B'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_TIMES = ['8:00-8:45', '8:45-9:30', '9:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-1:00'];
const SUBJECTS_BY_CLASS = {
  '10A': ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'],
  '10B': ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science'],
  '9A':  ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Physical Education'],
  '9B':  ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer Science'],
};

async function reseed() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Get teacher ids from users collection
  const teachers = await db.collection('users').find({ role: 'Teacher' }).toArray();
  if (teachers.length === 0) {
    console.log('No teachers found in DB. Skipping timetable seed.');
    process.exit(1);
  }

  // Drop existing timetable
  await db.collection('timetables').deleteMany({});
  console.log('Cleared old timetables');

  const entries = [];
  for (const className of CLASSES) {
    const subjects = SUBJECTS_BY_CLASS[className];
    for (const day of DAYS) {
      const periods = PERIOD_TIMES.map((time, i) => ({
        periodNumber: i + 1,
        time,
        subject: subjects[i % subjects.length],
        class: className,
        teacher: teachers[i % teachers.length]._id,
      }));
      entries.push({ className, day, periods });
    }
  }

  await db.collection('timetables').insertMany(entries);
  console.log(`Seeded ${entries.length} timetable entries with className field.`);
  await mongoose.disconnect();
}

reseed().catch(err => { console.error(err); process.exit(1); });
