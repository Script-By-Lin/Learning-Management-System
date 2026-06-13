You are a senior full-stack software engineer and system architect.

Your task is to design and develop a complete Learning Management System (LMS) using modern best practices.

## 🎯 Project Goal
Build a scalable, secure, and production-ready LMS that supports students, instructors, and administrators.

---

## 🧩 Functional Requirements

1. User Management
- User registration, login, logout
- Role-based access control (Admin, Instructor, Student)
- Profile management

2. Course Management
- Instructors can create, update, delete courses
- Students can enroll in courses
- Course categories and modules

3. Content Delivery
- Upload and stream video lessons ( with youtube shareable link in html , embended )
- Upload PDFs and materials
- Organize lessons into modules

4. Assessment System
- Create quizzes (MCQs)
- Auto grading system
- Assignment submission
- Grade tracking

5. Communication
- Discussion forum per course
- Messaging system
- Announcements

6. Progress Tracking
- Track course completion %
- Dashboard for students
- Certificate generation

7. Notifications
- Email notifications for:
  - Enrollment
  - Deadlines
  - Results

---

## ⚙️ Non-Functional Requirements

- High performance (fast API responses)
- Scalable architecture (support many users)
- Secure authentication (JWT)
- Data encryption and validation
- Responsive UI (mobile-friendly)
- Reliable (99.9% uptime)
- Clean and maintainable code

---

## 🏗️ Technology Stack

Backend:
- Next JS server
- RESTful API design

Frontend:
- Next.js

Database:
- PostgreSQL

Storage:
- Cloud storage for videos and files

Authentication:
- JWT-based authentication


---

## 🧠 Tasks You Must Perform

1. Design System Architecture
- Explain architecture (client-server, API structure)

2. Database Design
- Create ER diagram (users, courses, lessons, enrollments, quizzes, etc.)
- Provide SQL schema

3. Backend Development
- Build REST API endpoints:
  - Auth (login/register)
  - Courses
  - Enrollment
  - Quiz system
- Include folder structure

4. Frontend Development
- Build UI pages:
  - Login/Register
  - Dashboard
  - Course page
  - Video player
  - Quiz interface

5. Security Implementation
- Password hashing
- JWT authentication
- Role-based access control

6. Deployment Guide
- Step-by-step deployment instructions
- Use cloud platform

7. Testing
- Provide API testing examples (Postman)
- Include sample test cases

---

## 📦 Output Format

- Step-by-step explanation
- Clean, well-structured code
- Use comments in code
- Provide real-world best practices
- Keep explanations beginner-friendly but professional

---

## 🎯 Extra (Optional but Recommended)

- Add WebSocket for real-time chat
- Add analytics dashboard
- Add file upload system with validation
- Add Docker setup

---

Start from system design, then move step-by-step to implementation.
Do not skip any important part.