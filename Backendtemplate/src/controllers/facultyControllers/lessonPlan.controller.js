import { LessonPlan } from '../../models/LessonPlan.models.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { buildLessonPlanPrompt } from '../../utils/lessonPhraser.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function rephrase(content) {
    try {
        console.log('🤖 Calling Groq AI (llama-3.3-70b-versatile)...');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert educational content writer. Return ONLY valid JSON as instructed, no markdown, no explanation.'
                    },
                    {
                        role: 'user',
                        content: content
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!res.ok) {
            const errBody = await res.json();
            console.error(`Groq API failed (${res.status}):`, errBody.error?.message);
            return null;
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) { return null; }
        console.log('✅ Groq AI responded successfully');
        return text.replace(/```json|```/g, '').trim();
    } catch (error) {
        console.error('Groq API network error:', error.message);
        return null;
    }
}

// Create new lesson plan
export const createLessonPlan = asyncHandler(async (req, res) => {
    const aiResponseText = await rephrase(buildLessonPlanPrompt(req.body));
    console.log("AI response:", aiResponseText ? "received" : "unavailable (fallback mode)");

    let lessonData;

    if (aiResponseText) {
        // AI responded successfully — use AI-enhanced data
        try {
            lessonData = JSON.parse(aiResponseText);
        } catch (err) {
            console.error("Failed to parse AI response, using fallback:", err.message);
            lessonData = null;
        }
    }

    if (!lessonData) {
        // Fallback: use user-submitted data directly
        console.log("Using fallback: saving user data directly without AI enhancement");
        const body = req.body;
        lessonData = {
            title: body.title,
            subject: body.subject,
            grade: body.grade,
            section: body.section,
            date: body.date,
            duration: body.duration,
            learningObjectives: Array.isArray(body.learningObjectives) && body.learningObjectives.some(s => s)
                ? body.learningObjectives.filter(s => s)
                : ["To be determined"],
            prerequisiteKnowledge: body.prerequisiteKnowledge || "Basic understanding of the subject",
            teachingMethods: Array.isArray(body.teachingMethods) && body.teachingMethods.some(s => s)
                ? body.teachingMethods.filter(s => s)
                : ["Direct instruction", "Class discussion"],
            materials: Array.isArray(body.materials) && body.materials.some(s => s)
                ? body.materials.filter(s => s)
                : ["Textbook", "Whiteboard"],
            lessonStructure: {
                introduction: body.lessonStructure?.introduction || "Introduction to the topic",
                mainContent: body.lessonStructure?.mainContent || "Main lesson content",
                conclusion: body.lessonStructure?.conclusion || "Summary and review",
                assessment: body.lessonStructure?.assessment || "Quick Q&A"
            },
            homework: body.homework || "Review today's lesson",
            differentiation: {
                struggling: body.differentiation?.struggling || "Provide additional support and simplified materials",
                advanced: body.differentiation?.advanced || "Provide extension activities"
            },
            reflection: body.reflection || "",
            status: "Draft"
        };
    }

    // Validate required fields
    const requiredFields = ["title", "subject", "grade", "section", "date", "duration"];
    for (const field of requiredFields) {
        if (!lessonData[field]) {
            throw new ApiError(400, `Missing required field: ${field}`);
        }
    }

    // Add teacher ID
    lessonData.teacher = req.user._id;

    // Save to DB
    const lessonPlan = await LessonPlan.create(lessonData);

    return res.status(201).json(
        new ApiResponse(201, lessonPlan, "Lesson plan created successfully")
    );
});

// Get all lesson plans for a teacher with filters
export const getLessonPlans = asyncHandler(async (req, res) => {
    console.log("came to getLessonPlans");
    
    const {
        status,
        subject,
        grade,
        section,
        startDate,
        endDate,
        page = 1,
        limit = 10
    } = req.query;

    const filter = { teacher: req.user._id };

    // Apply filters
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (section) filter.section = section;
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const lessonPlans = await LessonPlan.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

    const total = await LessonPlan.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            lessonPlans,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }, "Lesson plans retrieved successfully")
    );
});

// Get lesson plan by ID
export const getLessonPlanById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lessonPlan = await LessonPlan.findOne({
        _id: id,
        teacher: req.user._id
    });

    if (!lessonPlan) {
        throw new ApiError(404, "Lesson plan not found");
    }

    return res.status(200).json(
        new ApiResponse(200, lessonPlan, "Lesson plan retrieved successfully")
    );
});

// Update lesson plan
export const updateLessonPlan = asyncHandler(async (req, res) => {
    console.log("came to updateLessonPlan");
    
    const { id } = req.params;
    const updates = req.body;

    const lessonPlan = await LessonPlan.findOneAndUpdate(
        { _id: id, teacher: req.user._id },
        { 
            ...updates,
            lastModified: Date.now()
        },
        { new: true, runValidators: true }
    );

    if (!lessonPlan) {
        throw new ApiError(404, "Lesson plan not found");
    }

    return res.status(200).json(
        new ApiResponse(200, lessonPlan, "Lesson plan updated successfully")
    );
});

// Delete lesson plan
export const deleteLessonPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lessonPlan = await LessonPlan.findOneAndDelete({
        _id: id,
        teacher: req.user._id
    });

    if (!lessonPlan) {
        throw new ApiError(404, "Lesson plan not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Lesson plan deleted successfully")
    );
});

// Change lesson plan status
export const updateLessonPlanStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!['Draft', 'Pending', 'Approved', 'Completed', 'Cancelled'].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const updateData = {
        status,
        lastModified: Date.now()
    };

    // If status is being set to Approved, add approval details
    if (status === 'Approved') {
        updateData.approvalDetails = {
            approvedBy: req.user._id,
            approvedAt: Date.now(),
            comments
        };
    }

    const lessonPlan = await LessonPlan.findOneAndUpdate(
        { _id: id, teacher: req.user._id },
        updateData,
        { new: true }
    );

    if (!lessonPlan) {
        throw new ApiError(404, "Lesson plan not found");
    }

    return res.status(200).json(
        new ApiResponse(200, lessonPlan, "Lesson plan status updated successfully")
    );
});

// Get lesson plan statistics
export const getLessonPlanStats = asyncHandler(async (req, res) => {
    // Get base stats for different statuses
    const statusStats = await LessonPlan.aggregate([
        { $match: { teacher: req.user._id } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Transform status stats into required format
    const formattedStats = {
        total: 0,
        completed: 0,
        pending: 0,
        draft: 0,
        cancelled: 0
    };

    statusStats.forEach(stat => {
        formattedStats.total += stat.count;
        switch(stat._id) {
            case 'Completed':
                formattedStats.completed = stat.count;
                break;
            case 'Pending':
                formattedStats.pending = stat.count;
                break;
            case 'Draft':
                formattedStats.draft = stat.count;
                break;
            case 'Cancelled':
                formattedStats.cancelled = stat.count;
                break;
        }
    });

    // Get monthly trends for comparison
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const monthlyTrends = await LessonPlan.aggregate([
        {
            $match: {
                teacher: req.user._id,
                createdAt: { $gte: previousMonth }
            }
        },
        {
            $group: {
                _id: {
                    status: '$status',
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    // Calculate trend percentages
    const currentMonth = new Date().getMonth() + 1;
    const lastMonth = currentMonth - 1 || 12;

    const calculateTrend = (status) => {
        const current = monthlyTrends.find(t => t._id.status === status && t._id.month === currentMonth)?.count || 0;
        const previous = monthlyTrends.find(t => t._id.status === status && t._id.month === lastMonth)?.count || 0;
        
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    const statsWithTrends = {
        ...formattedStats,
        trends: {
            total: calculateTrend(null),
            completed: calculateTrend('Completed'),
            pending: calculateTrend('Pending'),
            draft: calculateTrend('Draft')
        }
    };

    // Get subject distribution
    const subjectStats = await LessonPlan.aggregate([
        { $match: { teacher: req.user._id } },
        {
            $group: {
                _id: '$subject',
                count: { $sum: 1 }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            stats: statsWithTrends,
            subjectDistribution: subjectStats
        }, "Statistics retrieved successfully")
    );
});