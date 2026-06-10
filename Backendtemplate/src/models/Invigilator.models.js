import mongoose from "mongoose";

const invigilatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    faculty: { type: String, required: true },
    department: { type: String, required: true },
    assignedRoom: { type: String, required: true },
    examDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    contactNumber: { type: String, required: true },
    backupInvigilator: { type: String, default: "" }
}, { timestamps: true });

export const Invigilator = mongoose.model("Invigilator", invigilatorSchema);
