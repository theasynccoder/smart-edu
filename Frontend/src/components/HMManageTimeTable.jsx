import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const baseurl = import.meta.env.VITE_BASE_URL;

const PERIOD_TIMES = ['8:00-8:45', '8:45-9:30', '9:45-10:30', '10:30-11:15', '11:30-12:15', '12:15-1:00'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi', 'Physical Education', 'History', 'Geography'];
const CLASS_OPTIONS = ['10A', '10B', '9A', '9B', '8A', '8B', '7A', '7B'];
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const defaultPeriods = () =>
  PERIOD_TIMES.map((time, i) => ({ periodNumber: i + 1, time, subject: '', teacher: '' }));

const HMManageTimeTable = () => {
  const [groupedTimetable, setGroupedTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [absentTeachers, setAbsentTeachers] = useState(new Set());
  const [substitutions, setSubstitutions] = useState({});
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
  const [facultyFull, setFacultyFull] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTimetable, setNewTimetable] = useState({ className: '', day: '', periods: defaultPeriods() });

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseurl}/timetable/getTimetable`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        setError("Invalid data format received from server");
        setLoading(false);
        return;
      }

      const groupedData = {};
      data.forEach((entry) => {
        const { className, day, periods } = entry;
        if (!groupedData[className]) groupedData[className] = {};
        groupedData[className][day] = periods;
      });

      Object.keys(groupedData).forEach(className => {
        if (!groupedData[className]["Saturday"]) {
          groupedData[className]["Saturday"] = Array.from({ length: 6 }, (_, i) => ({
            periodNumber: i + 1,
            subject: (i + 1) % 2 === 0 ? "Sports" : "Rotational Activities",
            teacher: { name: "Coach Team" }
          }));
        }
      });

      setGroupedTimetable(groupedData);
      setActiveTab(prev => prev || Object.keys(groupedData)[0] || null);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching timetable:", err);
      setError("Failed to load timetable data");
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  useEffect(() => { fetchFacultyData(); }, []);

  const fetchFacultyData = async () => {
    try {
      const response = await axios.get(`${baseurl}/teachers/getfaculty`);
      const faculties = response.data.faculty || [];
      setFacultyFull(faculties);
      setAvailableSubstitutes([...new Set(faculties.map(f => f.name))]);
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      setAvailableSubstitutes([]);
    }
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    const { className, day, periods: formPeriods } = newTimetable;

    if (!className || !day) {
      setMessage('Please select a class and day.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const incomplete = formPeriods.some(p => !p.subject || !p.teacher);
    if (incomplete) {
      setMessage('Please fill in subject and teacher for all 6 periods.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const periodsPayload = formPeriods.map(p => ({
      periodNumber: p.periodNumber,
      time: p.time,
      subject: p.subject,
      class: className,
      teacher: p.teacher
    }));

    setCreateLoading(true);
    try {
      await axios.post(`${baseurl}/timetable/addTimetable`, {
        className,
        day,
        periods: periodsPayload
      });
      setMessage(`Timetable for Class ${className} - ${day} saved successfully!`);
      setTimeout(() => setMessage(''), 3000);
      setNewTimetable({ className: '', day: '', periods: defaultPeriods() });
      setShowCreateForm(false);
      await fetchTimetable();
    } catch (err) {
      console.error('Error creating timetable:', err);
      setMessage('Failed to create timetable. ' + (err.response?.data?.error || ''));
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setCreateLoading(false);
    }
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = [1, 2, 3, 4, 5, 6];

  const getSubjectColor = (subject, day) => {
    if (day === "Saturday") return "#f8d7da";
    const colorMap = {
      "Mathematics": "#d1ecf1", "Science": "#d4edda", "English": "#fff3cd",
      "History": "#f8d7da", "Geography": "#e2e3e5", "Computer Science": "#cce5ff",
      "Art": "#f5c6cb", "Music": "#c3e6cb", "Physical Education": "#ffeeba",
      "Social Studies": "#e2d9f3", "Hindi": "#fde8d8",
    };
    return colorMap[subject] || "#f8f9fa";
  };

  const handleTeacherClick = (teacher, day, period) => {
    if (day === "Saturday") return;
    setSelectedCell({ teacher, day, period });
    setShowSubModal(true);
  };

  const handleSubstitution = (substituteTeacher) => {
    if (!selectedCell) return;
    const { teacher, day, period } = selectedCell;
    const key = `${day}-${period}-${teacher.name}`;
    setAbsentTeachers(prev => { const s = new Set(prev); s.add(teacher.name); return s; });
    setSubstitutions(prev => ({ ...prev, [key]: substituteTeacher }));
    setShowSubModal(false);
    setSelectedCell(null);
  };

  const handleAnnouncement = async () => {
    const substitutionEntries = Object.entries(substitutions);
    if (substitutionEntries.length === 0) return;

    const newAnnouncements = substitutionEntries.map(([key, substitute]) => {
      const [day, period, originalTeacher] = key.split('-');
      return {
        title: "Teacher Substitution",
        description: `${originalTeacher} will be substituted by ${substitute} for Period ${period} on ${day}`,
        date: new Date()
      };
    });

    try {
      await axios.post(`${baseurl}/announcements`, newAnnouncements);
      setMessage("Substitution announcements posted successfully!");
      setSubstitutions({});
      setAbsentTeachers(new Set());
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error adding announcements:", error);
      setMessage("Failed to post substitution announcements.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } } };
  const headerVariants = { hidden: { y: -50, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } };

  const SubstitutionModal = () => (
    <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Select Substitute Teacher</h3>
        <div className="max-h-60 overflow-y-auto">
          {availableSubstitutes.map(substitute => (
            <motion.button key={substitute} onClick={() => handleSubstitution(substitute)}
              className="w-full p-3 text-left hover:bg-gray-100 rounded-lg mb-2 transition-colors duration-200"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {substitute}
            </motion.button>
          ))}
        </div>
        <motion.button onClick={() => setShowSubModal(false)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 w-full"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          Cancel
        </motion.button>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="timetable-management-container p-6">
      <motion.div className="timetable-header text-center mb-8" initial="hidden" animate="visible" variants={headerVariants}>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">School Timetable Management</h1>
        <p className="text-gray-600">View and manage class schedules</p>
      </motion.div>

      {/* Message */}
      {message && (
        <motion.div
          className={`mb-4 p-3 rounded-lg text-center font-medium ${message.includes('success') || message.includes('saved') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {message}
        </motion.div>
      )}

      {/* Create New Timetable Button */}
      <div className="mb-6">
        <motion.button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          {showCreateForm ? '✕ Close Form' : '+ Create New Timetable'}
        </motion.button>

        {showCreateForm && (
          <motion.div
            className="mt-4 bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-5">Create Timetable Entry</h2>
            <form onSubmit={handleCreateTimetable}>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={newTimetable.className}
                    onChange={e => setNewTimetable(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Class</option>
                    {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={newTimetable.day}
                    onChange={e => setNewTimetable(prev => ({ ...prev, day: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Select Day</option>
                    {WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b p-3 text-left text-gray-600 w-16">Period</th>
                      <th className="border-b p-3 text-left text-gray-600 w-32">Time</th>
                      <th className="border-b p-3 text-left text-gray-600">Subject</th>
                      <th className="border-b p-3 text-left text-gray-600">Teacher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newTimetable.periods.map((period, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border-b p-3 font-semibold text-center text-gray-700">{period.periodNumber}</td>
                        <td className="border-b p-3 text-gray-500 text-xs">{period.time}</td>
                        <td className="border-b p-3">
                          <select
                            value={period.subject}
                            onChange={e => {
                              const updated = [...newTimetable.periods];
                              updated[idx] = { ...updated[idx], subject: e.target.value };
                              setNewTimetable(prev => ({ ...prev, periods: updated }));
                            }}
                            className="w-full border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            required
                          >
                            <option value="">Select Subject</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="border-b p-3">
                          <select
                            value={period.teacher}
                            onChange={e => {
                              const updated = [...newTimetable.periods];
                              updated[idx] = { ...updated[idx], teacher: e.target.value };
                              setNewTimetable(prev => ({ ...prev, periods: updated }));
                            }}
                            className="w-full border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            required
                          >
                            <option value="">Select Teacher</option>
                            {facultyFull.map(f => (
                              <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-3">
                <motion.button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {createLoading ? 'Saving...' : 'Save Timetable'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewTimetable({ className: '', day: '', periods: defaultPeriods() }); }}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {loading && (
        <motion.div className="flex items-center justify-center p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="loader"></div>
          <p className="ml-4 text-gray-600">Loading timetables...</p>
        </motion.div>
      )}

      {error && (
        <motion.div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </motion.div>
      )}

      {!loading && !error && (
        <motion.div className="timetable-content" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div className="flex flex-wrap gap-2 mb-6" variants={itemVariants}>
            {Object.keys(groupedTimetable).map((className) => (
              <motion.button
                key={className}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${activeTab === className ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={() => setActiveTab(className)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                Class {className}
              </motion.button>
            ))}
          </motion.div>

          {Object.keys(groupedTimetable).length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">No timetable data found.</p>
              <p className="text-sm mt-2">Click "+ Create New Timetable" to add one.</p>
            </div>
          )}

          {activeTab && (
            <motion.div className="bg-white rounded-lg shadow-lg p-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Class {activeTab} Weekly Schedule</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-3 bg-gray-50">Period</th>
                      {days.map((day) => (
                        <th key={day} className={`border p-3 ${day === "Saturday" ? "bg-red-50" : "bg-gray-50"}`}>{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period}>
                        <td className="border p-3 font-medium bg-gray-50">Period {period}</td>
                        {days.map((day) => {
                          const periodData = groupedTimetable[activeTab][day]?.find(p => p.periodNumber === period);
                          const isSpecialDay = day === "Saturday";
                          const key = periodData ? `${day}-${period}-${periodData.teacher?.name || ''}` : null;
                          const substitute = key ? substitutions[key] : null;
                          return (
                            <motion.td
                              key={`${activeTab}-${day}-${period}`}
                              className={`border p-3 ${isSpecialDay ? "bg-red-50" : ""} ${substitute ? "bg-yellow-50" : ""}`}
                              style={{ backgroundColor: getSubjectColor(periodData?.subject, day), cursor: isSpecialDay ? "default" : "pointer" }}
                              whileHover={{ scale: isSpecialDay ? 1 : 1.05, boxShadow: isSpecialDay ? "none" : "0 5px 15px rgba(0,0,0,0.1)" }}
                              onClick={() => periodData && !isSpecialDay && handleTeacherClick(periodData.teacher, day, period)}
                            >
                              {periodData ? (
                                <div>
                                  <div className="font-medium">{periodData.subject}</div>
                                  <div className="text-sm text-gray-600">
                                    {substitute ? (
                                      <span className="text-green-600 font-medium">{substitute}</span>
                                    ) : (
                                      <span className={absentTeachers.has(periodData.teacher?.name) ? "text-red-600" : ""}>
                                        {periodData.teacher?.name || '—'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-gray-500">Free Period</div>
                              )}
                            </motion.td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {showSubModal && <SubstitutionModal />}

      {Object.keys(substitutions).length > 0 && (
        <motion.div className="fixed bottom-4 left-1/2 transform -translate-x-1/2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.button
            onClick={handleAnnouncement}
            className="px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            Post Substitution Announcements ({Object.keys(substitutions).length})
          </motion.button>
        </motion.div>
      )}

      <style>{`
        .loader { border: 3px solid #f3f3f3; border-radius: 50%; border-top: 3px solid #3498db; width: 24px; height: 24px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .timetable-management-container { min-height: 100vh; background-color: #f8f9fa; }
      `}</style>
    </div>
  );
};

export default HMManageTimeTable;