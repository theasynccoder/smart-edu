import { Invigilator } from "../../models/Invigilator.models.js";

export const addInvigilator = async (req, res) => {
    try {
        const invigilator = new Invigilator(req.body);
        await invigilator.save();
        res.status(201).json(invigilator);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getInvigilators = async (req, res) => {
    try {
        const invigilators = await Invigilator.find().sort({ createdAt: -1 });
        res.json(invigilators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteInvigilator = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Invigilator.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Invigilator not found" });
        res.json({ message: "Invigilator deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
