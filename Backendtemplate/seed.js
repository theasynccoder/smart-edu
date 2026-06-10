import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'schoolDB';

// Minimal schemas
const userSchema = new mongoose.Schema({ name: String, email: String });
const periodSchema = new mongoose.Schema({
    periodNumber: Number,
    time: String,
    subject: String,
    class: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isSubstituted: { type: Boolean, default: false },
    substituteTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});
const timetableSchema = new mongoose.Schema({
    className: String,
    day: String,
    periods: [periodSchema]
});

const User = mongoose.model('User', userSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);

const CLASSES = ['10A', '10B', '9A', '9B'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_TIMES = ['8:00-8:45', '8:45-9:30', '9:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-1:00'];

// Subject rotation per day for variety
const SUBJECT_SCHEDULE = {
    '10A': {
        Monday:    ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'],
        Tuesday:   ['English', 'Mathematics', 'Hindi', 'Science', 'Social Studies', 'Computer Science'],
        Wednesday: ['Science', 'Hindi', 'Mathematics', 'Computer Science', 'English', 'Social Studies'],
        Thursday:  ['Social Studies', 'Computer Science', 'Science', 'Mathematics', 'Hindi', 'English'],
        Friday:    ['Computer Science', 'English', 'Social Studies', 'Hindi', 'Mathematics', 'Science'],
    },
    '10B': {
        Monday:    ['English', 'Mathematics', 'Science', 'Hindi', 'Computer Science', 'Social Studies'],
        Tuesday:   ['Mathematics', 'Science', 'Social Studies', 'Computer Science', 'English', 'Hindi'],
        Wednesday: ['Hindi', 'Social Studies', 'English', 'Mathematics', 'Science', 'Computer Science'],
        Thursday:  ['Computer Science', 'English', 'Mathematics', 'Social Studies', 'Hindi', 'Science'],
        Friday:    ['Science', 'Hindi', 'Computer Science', 'English', 'Social Studies', 'Mathematics'],
    },
    '9A': {
        Monday:    ['Mathematics', 'English', 'Science', 'Hindi', 'Social Studies', 'Computer Science'],
        Tuesday:   ['Science', 'Social Studies', 'Mathematics', 'Computer Science', 'Hindi', 'English'],
        Wednesday: ['English', 'Mathematics', 'Hindi', 'Science', 'Computer Science', 'Social Studies'],
        Thursday:  ['Hindi', 'Computer Science', 'Social Studies', 'English', 'Mathematics', 'Science'],
        Friday:    ['Social Studies', 'Science', 'Computer Science', 'Mathematics', 'English', 'Hindi'],
    },
    '9B': {
        Monday:    ['Science', 'Mathematics', 'English', 'Computer Science', 'Hindi', 'Social Studies'],
        Tuesday:   ['Hindi', 'English', 'Computer Science', 'Mathematics', 'Social Studies', 'Science'],
        Wednesday: ['Computer Science', 'Science', 'Social Studies', 'English', 'Mathematics', 'Hindi'],
        Thursday:  ['Mathematics', 'Hindi', 'English', 'Science', 'Computer Science', 'Social Studies'],
        Friday:    ['English', 'Social Studies', 'Hindi', 'Computer Science', 'Science', 'Mathematics'],
    }
};

async function seed() {
    await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
    console.log('✅ Connected to MongoDB');

    const teacher = await User.findOne();
    if (!teacher) {
        console.log('❌ No users found! Please register first.');
        process.exit(1);
    }
    console.log(`👤 Using teacher: ${teacher.name}`);

    // Clear existing timetable
    await Timetable.deleteMany({});
    console.log('🗑️  Cleared existing timetable data');

    let count = 0;
    for (const className of CLASSES) {
        for (const day of DAYS) {
            const subjects = SUBJECT_SCHEDULE[className]?.[day] || 
                ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'];
            
            const periods = subjects.map((subject, i) => ({
                periodNumber: i + 1,
                time: PERIOD_TIMES[i],
                subject,
                class: className,
                teacher: teacher._id,
                isSubstituted: false
            }));

            await Timetable.create({ className, day, periods });
            count++;
            console.log(`✅ ${className} - ${day} (${subjects.join(', ')})`);
        }
    }

    console.log(`\n🎉 Done! Created ${count} timetable entries (${CLASSES.length} classes × ${DAYS.length} days)`);
    await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
