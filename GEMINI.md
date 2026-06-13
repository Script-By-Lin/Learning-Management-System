# GEMINI.md

AI Agent Instructions for Building LMS (Full Stack Application)

---

# 1. Role of the AI Agent

You are an autonomous AI Software Engineering Agent responsible for designing and building a **production-ready Learning Management System (LMS)**.

You must follow:

* clean architecture
* Client-Server backend structure
* strict directory separation
* modular code design
* scalable system practices

You must generate **maintainable, testable, and structured code**.

---

# 2. Architecture Model

The application must follow **Full Stack + 3 Layer Backend Architecture**

Frontend (Presentation Layer)
|
| HTTP / REST
|
Backend API (Business Logic Layer)
|
Data Access Layer (Repository / ORM)
|
Database

---

# 3. Technology Stack (MANDATORY)

Frontend

* Next.js (App Router)
* TypeScript
* TailwindCSS
* Fetch API

Backend

* Next.js API Routes OR Python FastAPI (hybrid allowed)
* RESTful API
* JWT Authentication

Database

* PostgreSQL

ORM

* Prisma

*** You MUST initialize the project (Next.js app + backend setup) ***

---

# 4. LMS Functional Requirements

1. User Management

* Registration, login, logout
* Role-based access (Admin, Instructor, Student)
* Profile management

2. Course Management

* Create, update, delete courses
* Student enrollment
* Course categories and modules

3. Content Delivery

* Upload and stream video lessons
* Upload PDFs and materials
* Structured lessons

4. Assessment System

* MCQ quizzes
* Auto grading
* Assignment submission
* Grade tracking

5. Communication

* Course discussions
* Messaging
* Announcements

6. Progress Tracking

* Completion percentage
* Dashboard
* Certificate generation

7. Notifications

* Email alerts (enrollment, deadlines, results)

---

# 5. Non-Functional Requirements

* High performance
* Scalable system design
* Secure authentication
* Mobile responsive UI
* Reliable uptime
* Clean and maintainable code

---

# 6. Layer Responsibilities

## Presentation Layer (Frontend)

Responsibilities:

* UI rendering
* form handling
* client validation
* API requests
* authentication UI
* initialize the Next.js frontend

Restrictions:

* NO business logic
* NO direct database access

---

## Business Logic Layer (Backend)

Responsibilities:

* core LMS logic
* validation
* workflows (enrollment, grading)
* API processing
* initialize backend services

---

# 7. MCP Integration (Generic Only)

Directory:
backend/services/mcp/

Structure:

* mcp_client
* mcp_router
* mcp_tools
* mcp_context

Rules:

* Must be generic
* Must use environment variables
* Must NOT hardcode server

Environment variables:

* MCP_SERVER_URL
* MCP_API_KEY
* MCP_TIMEOUT

---

# 8. External API Integration

Directory:
backend/integrations/

Modules:

* payment_service
* email_service (SendGrid)
* storage_service (for videos/files)
* ai_service

Rules:

* Each API must be isolated
* Implement retry + error handling
* Controllers MUST NOT call APIs directly

---

# 9. Project Directory Structure

project-root/

frontend/

* app
* components
* pages
* services
* hooks
* utils
* styles

backend/

api/

* routes
* controllers

services/

* business
* mcp

repositories/
models/
integrations/
middleware/

core/

* config
* security

database/

* migrations
* seed

shared/

* types
* constants

scripts/

tests/

* unit
* integration
* e2e

docs/

---

# 10. API Design Standards

Follow REST conventions:

GET /api/users
GET /api/users/{id}
POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}

Response format:

{
"success": true,
"data": {},
"error": null
}

---

# 11. Security Requirements

* JWT authentication
* input validation
* rate limiting
* secure headers
* CORS
* environment variables protection

---

# 12. Logging

Log:

* API requests
* errors
* external API failures
* MCP communication

Use centralized logging utility

---

# 13. Testing Requirements

tests/

* unit
* integration
* e2e

Tools:

* pytest / jest
* supertest
* playwright

All core logic must be tested

---

# 14. Documentation

docs/ must include:

* architecture overview
* API documentation
* environment setup
* deployment guide

---

# 15. Environment Variables

Use .env for:

DATABASE_URL
JWT_SECRET
MCP_SERVER_URL
MCP_API_KEY
EMAIL_API_KEY

Never hardcode secrets

---

# 16. Agent Execution Plan

Before coding, you MUST:

1. Design LMS architecture
2. Create full directory structure
3. Initialize Next.js project
4. Setup backend (API routes or FastAPI)
5. Setup Prisma + PostgreSQL
6. Separate frontend/backend logic
7. Implement authentication
8. Build LMS modules step-by-step
9. Create './temporary/todo-list.md'

---

# 17. Strict Rules

* Never mix layers
* Never bypass services
* Controllers must NOT contain business logic
* All code must follow directory rules
* Code must be modular and production-ready

---

# END OF GEMINI.md
