# Smart Education Management System

A comprehensive full-stack educational management platform designed to streamline academic operations, student management, and teacher-student interactions with integrated AI chatbot support.

## 🎯 Overview

Smart Education Management System is an intelligent platform that helps educational institutions manage:

- **Student Information & Enrollment**
- **Teacher & Faculty Management**
- **Time Table & Exam Management**
- **Attendance Tracking**
- **Marks & Performance Analysis**
- **Lesson Planning**
- **AI-Powered Chatbot** for student information queries
- **SMS Notifications** via Twilio

---

## 📚 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## 🛠️ Tech Stack

### Backend

- **Node.js** with **Express.js** - REST API server
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication & Authorization
- **Twilio** - SMS notifications
- **Google Generative AI** - AI integration

### Frontend

- **React 19** - UI library
- **Vite** - Build tool & dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Styling
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **Recharts** - Data visualization

### ChatBot Backend

- **Python** - FastAPI
- **Google Generative AI** - Natural language processing
- **MongoDB** - Database queries

---

## 📁 Project Structure

```
share/
├── Backendtemplate/          # Node.js/Express Backend
│   ├── src/
│   │   ├── app.js           # Express app setup
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middlewares/     # Auth & CORS
│   │   ├── utils/           # Helper functions
│   │   └── db/              # Database connection
│   ├── index.js             # Server entry point
│   ├── package.json
│   ├── vercel.json          # Vercel deployment config
│   └── .env                 # Environment variables
│
├── Frontend/                 # React/Vite Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # Entry point
│   │   └── assets/          # Static files
│   ├── index.html
│   ├── vite.config.js       # Vite configuration
│   ├── package.json
│   └── .env                 # Environment variables
│
└── ChatbotBackend/          # Python FastAPI ChatBot
    ├── main.py              # FastAPI app
    ├── requirements.txt     # Python dependencies
    └── test_groq.py         # Testing file
```

---

## 📋 Prerequisites

- **Node.js** (v16+ recommended)
- **npm** or **yarn** package manager
- **Python** 3.8+ (for ChatBot)
- **MongoDB** (local or MongoDB Atlas cloud)
- **Git**

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd share
```

### 2. Backend Setup

```bash
cd Backendtemplate
npm install
```

### 3. Frontend Setup

```bash
cd ../Frontend
npm install
```

### 4. ChatBot Backend Setup

```bash
cd ../ChatbotBackend
pip install -r requirements.txt
```

---

## 🔐 Environment Setup

### Backend (.env)

Create `Backendtemplate/.env`:

```env
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
GOOGLE_API_KEY=your-google-ai-key
```

### Frontend (.env)

Create `Frontend/.env`:

```env
VITE_BASE_URL=http://localhost:8080/api/v1
VITE_CHATBOT_URL=http://localhost:8000
```

### ChatBot Backend (.env)

Create `ChatbotBackend/.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
GOOGLE_API_KEY=your-google-ai-key
PORT=8000
```

---

## 💻 Running Locally

### Terminal 1: Backend

```bash
cd Backendtemplate
npm run dev
# Server runs on http://localhost:8080
```

### Terminal 2: Frontend

```bash
cd Frontend
npm run dev
# App runs on http://localhost:5173
```

### Terminal 3: ChatBot Backend

```bash
cd ChatbotBackend
python main.py
# ChatBot server runs on http://localhost:8000
```

---

## 🌐 Deployment

### Option 1: Vercel (Recommended)

#### Deploy Backend

```bash
cd Backendtemplate
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel Dashboard:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your frontend URL)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `GOOGLE_API_KEY`

Update `vercel.json` CORS header with your frontend URL.

#### Deploy Frontend

```bash
cd ../Frontend
vercel --prod
```

Add environment variables:

- `VITE_BASE_URL` (your Vercel backend URL + `/api/v1`)
- `VITE_CHATBOT_URL` (your ChatBot URL)

### Option 2: Render (ChatBot Backend)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create New Web Service
4. Connect GitHub repo
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables

### MongoDB Atlas Setup

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to environment variables

---

## ✨ Features

### Student Management

- Register & authenticate students
- View student profiles & enrollment
- Track student attendance
- View marks & performance

### Teacher Management

- Register & manage teachers
- Create lesson plans
- Mark attendance
- Upload marks
- Send announcements

### Time Table & Exams

- Create & manage time tables
- Schedule exams
- Assign invigilators
- Track exam marks

### Attendance

- Daily attendance marking
- Monthly/semester reports
- Automated SMS notifications

### AI Chatbot

- Query student information by name/class/roll number
- Natural language processing
- Integrated with MongoDB

### Notifications

- SMS alerts via Twilio
- Real-time updates
- Announcement system

---

## 📡 API Documentation

### Authentication Endpoints

- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/getProfile` - Get user profile
- `POST /api/v1/users/logout` - User logout

### Student Endpoints

- `GET /api/v1/students` - Get all students
- `GET /api/v1/students/:id` - Get student by ID
- `POST /api/v1/students` - Create student
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

### Teacher Endpoints

- `GET /api/v1/teachers` - Get all teachers
- `POST /api/v1/teachers` - Create teacher
- `PUT /api/v1/teachers/:id` - Update teacher

### Other Endpoints

- `/api/v1/timetable` - Time table management
- `/api/v1/subjects` - Subject management
- `/api/v1/exams` - Exam management
- `/api/v1/lessonPlans` - Lesson planning
- `/api/v1/announcements` - Announcements
- `/api/v1/sms` - SMS notifications

### ChatBot Endpoint

- `POST /query` - Query student information
  ```json
  {
    "query": "Show students in class 10A"
  }
  ```

---

## 🔧 Troubleshooting

### 404 Error on API Calls

- Ensure `VITE_BASE_URL` includes `/api/v1`
- Example: `https://smart-edu-back.vercel.app/api/v1`

### CORS Errors

- Update `CORS` config in backend `app.js`
- Ensure `CLIENT_URL` matches your frontend URL
- Update `vercel.json` CORS headers for production

### Mixed Content Issues

- Ensure all URLs use HTTPS in production
- Update environment variables on deployment platform

### ChatBot Not Responding

- Ensure ChatBot server is running
- Check MongoDB connection
- Verify `VITE_CHATBOT_URL` environment variable

---

## 📝 License

This project is licensed under ISC License.

---

## 👥 Contributors

- **Vishesh P Gowda** - Backend Development

---

## 📧 Contact & Support

For issues, questions, or suggestions, please create an issue in the repository or contact the development team.

---

## 🚀 Quick Links

- [Live Frontend](https://smart-edu-front.vercel.app)
- [Live Backend](https://smart-edu-back.vercel.app)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vercel Console](https://vercel.com/dashboard)
- [Render Console](https://dashboard.render.com)

---

**Last Updated:** June 11, 2026
