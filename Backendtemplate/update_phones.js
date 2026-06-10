import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

const result = await mongoose.connection.db
  .collection('students')
  .updateMany({}, { $set: { phone_no: 9353327770 } });

console.log(`Updated ${result.modifiedCount} students — phone_no set to 9353327770`);

// Verify
const students = await mongoose.connection.db.collection('students').find().toArray();
students.forEach(s => console.log(`  ${s.name}: ${s.phone_no}`));

await mongoose.disconnect();
