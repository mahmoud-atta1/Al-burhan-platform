<div align="center">

<br />

<img src="https://img.shields.io/badge/-%F0%9F%8E%93%20Al--Burhan%20Platform-0B1437?style=for-the-badge&logoColor=F5B800" alt="Al-Burhan Platform" height="42" />

<br /><br />

**A full-featured Arabic e-learning platform for Egyptian secondary school students.**
<br />
Structured curriculum tracks · video & PDF lessons · timed MCQ exams · enrollment management · admin control panel.

<br />

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?style=flat-square)](https://mongoosejs.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Joi](https://img.shields.io/badge/Joi-Validation-0080FF?style=flat-square)](https://joi.dev)
[![Multer](https://img.shields.io/badge/Multer-Upload-FF6600?style=flat-square)](https://github.com/expressjs/multer)
[![Sharp](https://img.shields.io/badge/Sharp-Image_Processing-99CC00?style=flat-square)](https://sharp.pixelplumbing.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-F5B800?style=flat-square)](LICENSE)

<br />

[Features](#-features) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Data Models](#-data-models) · [Getting Started](#-getting-started) · [Roadmap](#-roadmap)

<br />

</div>

---

## 🌟 Overview

**Al-Burhan Platform** is a production-ready REST API powering an Arabic e-learning experience tailored for Egyptian secondary school students (Grades 10, 11, and 12). Students browse curriculum tracks, enroll in paid or free courses, consume video and PDF lessons, and sit timed multiple-choice exams with instant automated grading. Administrators control every aspect of content and user management through a dedicated set of protected endpoints.

> **"Al-Burhan" (البرهان)** means *"the proof"* — a fitting name for a platform built to help students prove themselves.

---

## ✨ Features

### For Students
- 🎓 **Curriculum Tracks** — browse content organized by grade (1st, 2nd, 3rd Secondary)
- 📚 **Course Catalog** — paid & free courses with cover images, pricing, and duration
- 🎬 **Rich Lessons** — video, PDF, exam, and assignment lesson types
- 📝 **Timed Exams** — MCQ exams with configurable availability windows and auto-grading
- 🏆 **Instant Results** — score breakdown and per-question answer review after submission
- 🎫 **Enrollment Flow** — request enrollment with payment screenshot upload → await admin approval
- 👤 **Profile Management** — update personal info and change password

### For Administrators
- 🗂 **Full Content CRUD** — tracks, courses, weeks, lessons, exams, and questions
- ✅ **Enrollment Management** — approve, cancel, or manually assign enrollments
- 👥 **User Management** — activate/deactivate accounts, reset any user's password
- 📊 **Attempt Oversight** — view all student exam attempts per exam

### Platform-wide
- 🔐 **Secure Auth** — JWT-based authentication with bcrypt password hashing
- 🛑 **Rate Limiting** — brute-force protection on login and password-reset endpoints
- 🖼 **Image Processing** — automatic resize & compression via Sharp
- 📄 **PDF Uploads** — lesson PDF files stored and served from the server
- ✅ **Arabic Validation** — all Joi error messages in Arabic, matching the student-facing UI
- 🌐 **Nested Resource Routing** — intuitive RESTful URL hierarchy

---

## 🏗 Architecture

### Project Structure

```
al-burhan-platform/
└── backend/
    ├── config/
    │   └── db.js                     # MongoDB connection with timeout config
    │
    ├── middlewares/
    │   ├── enrollment.middleware.js  # Active enrollment guard
    │   ├── errorMiddleware.js        # Centralised error handler
    │   ├── uploadMiddleware.js       # Multer + Sharp resize + PDF save
    │   └── validatorMiddleware.js    # Runs Joi schemas; collects all errors
    │
    ├── routes/
    │   ├── index.js                  # Mounts all routers onto the Express app
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── track.routes.js
    │   ├── course.routes.js
    │   ├── week.routes.js
    │   ├── lesson.routes.js
    │   ├── exam.routes.js
    │   ├── examAttempt.routes.js
    │   ├── question.routes.js
    │   └── enrollment.routes.js
    │
    └── validators/
        ├── auth.validator.js
        ├── course.validator.js
        ├── enrollment.validator.js
        ├── exam.validator.js
        ├── examAttempt.validator.js
        ├── lesson.validator.js
        ├── question.validator.js
        ├── track.validator.js
        ├── user.validator.js
        └── week.validator.js
```

### URL Hierarchy

```
/api/v1/
│
├── auth/                              Public + rate-limited
├── users/                             Protected (student self-service + admin)
│
├── tracks/                            Public list / detail
│   └── :trackId/courses/
│
├── courses/                           Public list / detail
│   └── :courseId/
│       ├── weeks/
│       │   └── :weekId/
│       │       ├── content            Protected — active enrollment required
│       │       ├── lessons/
│       │       └── exams/
│       │           └── :examId/
│       │               ├── questions/
│       │               └── attempts/
│       │                   ├── start
│       │                   ├── submit
│       │                   └── my
│       └── exams/                     Same sub-tree accessible at course level
│
├── weeks/                             Standalone (mergeParams)
├── exams/                             Standalone (mergeParams)
│
└── enrollments/
    ├── courses/:courseId/request      Student — upload payment screenshot
    ├── me                             Student — own enrollments
    ├── manual-assign                  Admin
    ├── :id/approve                    Admin
    └── :id/cancel                     Admin
```

### Enrollment Guard Logic

```
Request hits a protected lesson / exam endpoint
                    │
                    ▼
         Is user an admin? ──YES──► Pass through
                    │
                   NO
                    │
                    ▼
         Resolve courseId
   (courseId param → weekId → examId → examId in body)
                    │
                    ▼
         Course price == 0? ──YES──► Pass through (free content)
                    │
                   NO
                    │
                    ▼
  Find Enrollment { studentId, courseId, status: "active" }
                    │
              Not found ──► 403
                    │
                 Found
                    │
         expiresAt < now? ──YES──► status = "expired", save → 403
                    │
                   NO
                    │
                    ▼
         Attach req.enrollment → next()
```

---

## 📡 API Reference

**Base URL:** `http://localhost:3000/api/v1`

**Authentication header:**
```
Authorization: Bearer <JWT>
```

**Legend:** Public = no token · ✅ Any = any logged-in user · 🔑 Admin = admin role only · ✅ Enrolled = student with active enrollment (or admin)

---

### 🔐 Authentication — `/auth`

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| `POST` | `/signup` | Register new student | Public | — |
| `POST` | `/login` | Login with phone **or** email | Public | 5 req / 15 min |
| `POST` | `/logout` | Invalidate session | ✅ Any | — |
| `POST` | `/forgot-password` | Send 6-digit reset code | Public | 5 req / hr |
| `POST` | `/verify-reset-code` | Verify the reset code | Public | — |
| `PUT` | `/reset-password` | Set new password | Public | — |

<details>
<summary><strong>POST /signup — Body</strong></summary>

```json
{
  "fullName": "Ahmed Mohamed Ali",
  "email": "ahmed@example.com",
  "phone": "01012345678",
  "password": "secret123",
  "passwordConfirm": "secret123",
  "gender": "male",
  "educationLevel": "second_secondary",
  "parentPhone": "01098765432",
  "governorate": "Cairo"
}
```

| Field | Rules |
|-------|-------|
| `fullName` | 3–50 chars |
| `email` | Valid email format |
| `phone` | Egyptian format `01[0125]XXXXXXXX` — exactly 11 digits |
| `password` | Min 6 chars |
| `passwordConfirm` | Must match `password` |
| `gender` | `"male"` \| `"female"` |
| `educationLevel` | `"first_secondary"` \| `"second_secondary"` \| `"third_secondary"` |
| `parentPhone` | Egyptian format — exactly 11 digits |
| `governorate` | Non-empty string |

</details>

<details>
<summary><strong>POST /login — Body & Response</strong></summary>

```json
{ "phone": "01012345678", "password": "secret123" }
// OR
{ "email": "ahmed@example.com", "password": "secret123" }
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "user": { "_id": "...", "fullName": "...", "role": "student" } }
}
```

</details>

---

### 👤 Users — `/users`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/me` | Get my profile | ✅ Any |
| `PUT` | `/update-me` | Update name / email / governorate | ✅ Any |
| `PUT` | `/change-my-password` | Change own password | ✅ Any |
| `DELETE` | `/delete-me` | Delete own account | ✅ Any |
| `GET` | `/` | List all users | 🔑 Admin |
| `GET` | `/:id` | Get user by ID | 🔑 Admin |
| `PUT` | `/:id/status` | Activate / deactivate account | 🔑 Admin |
| `PUT` | `/:id/password` | Reset a user's password | 🔑 Admin |

---

### 🗂 Tracks — `/tracks`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List all tracks | Public |
| `GET` | `/:id` | Track details | Public |
| `POST` | `/` | Create track | 🔑 Admin |
| `PUT` | `/:id` | Update track | 🔑 Admin |
| `DELETE` | `/:id` | Delete track | 🔑 Admin |

`educationLevel` values: `"1st_secondary"` · `"2nd_secondary"` · `"3rd_secondary"`

> Upload `coverImage` as `multipart/form-data` — auto-resized to **800 × 450 px** via Sharp.

---

### 📚 Courses — `/courses` & `/tracks/:trackId/courses`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/courses` | All courses | Public |
| `GET` | `/tracks/:trackId/courses` | Courses in a track | Public |
| `GET` | `/courses/:id` | Course details | Public |
| `POST` | `/tracks/:trackId/courses` | Create course | 🔑 Admin |
| `PUT` | `/courses/:id` | Update course | 🔑 Admin |
| `DELETE` | `/courses/:id` | Delete course | 🔑 Admin |

<details>
<summary><strong>POST — Body</strong></summary>

```json
{
  "title": "Algebra & Trigonometry",
  "description": "Complete Grade 11 math curriculum.",
  "price": 150,
  "durationInWeeks": 8,
  "isPublished": true
}
```

`price: 0` marks the course as **free** — the enrollment guard is bypassed automatically for free courses.

</details>

---

### 📅 Weeks — `/weeks` & `/courses/:courseId/weeks`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/courses/:courseId/weeks` | List weeks | Public |
| `GET` | `/weeks/:id` | Week details | Public |
| `GET` | `/weeks/:weekId/content` | Full week content (lessons + exams) | ✅ Enrolled |
| `POST` | `/courses/:courseId/weeks` | Create week | 🔑 Admin |
| `PUT` | `/weeks/:id` | Update week | 🔑 Admin |
| `DELETE` | `/weeks/:id` | Delete week | 🔑 Admin |

---

### 🎬 Lessons — `/weeks/:weekId/lessons`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List lessons in week | ✅ Enrolled |
| `GET` | `/:id` | Lesson details | ✅ Enrolled |
| `POST` | `/` | Create lesson | 🔑 Admin |
| `PUT` | `/:id` | Update lesson | 🔑 Admin |
| `DELETE` | `/:id` | Delete lesson | 🔑 Admin |

<details>
<summary><strong>POST — Body & Upload</strong></summary>

```json
{
  "title": "Quadratic Equations",
  "description": "Solving using the formula and factoring.",
  "type": "video",
  "order": 1,
  "contentUrl": "https://...",
  "isFree": false,
  "isPublished": true
}
```

| `type` | Upload Field | Server Handling |
|--------|-------------|----------------|
| `video` | `contentUrl` (URL string in body) | None |
| `pdf` | `pdfFile` (multipart) | Saved to `/uploads/lessons/` |
| `exam` | — | Links to an Exam document |
| `assignment` | `contentUrl` | None |

</details>

---

### 📝 Exams — `/courses/:courseId/exams` & `/weeks/:weekId/exams`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/courses/:courseId/exams` | Exams in a course | ✅ Enrolled |
| `GET` | `/weeks/:weekId/exams` | Exams in a week | ✅ Enrolled |
| `GET` | `/courses/:courseId/exams/:id` | Exam details | ✅ Enrolled |
| `POST` | `/courses/:courseId/exams` | Create exam | 🔑 Admin |
| `PUT` | `/courses/:courseId/exams/:id` | Update exam | 🔑 Admin |
| `DELETE` | `/courses/:courseId/exams/:id` | Delete exam | 🔑 Admin |

<details>
<summary><strong>POST — Body</strong></summary>

```json
{
  "title": "Week 2 Exam",
  "duration": 30,
  "totalMarks": 20,
  "availableFrom": "2025-03-10T10:00:00Z",
  "availableUntil": "2025-03-15T23:59:00Z",
  "isPublished": true,
  "weekId": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```

> `availableUntil` must be strictly after `availableFrom` — enforced by a custom Joi validator.

</details>

---

### ❓ Questions — `/exams/:examId/questions`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List questions | ✅ Enrolled |
| `GET` | `/:id` | Question details | ✅ Enrolled |
| `POST` | `/` | Add question | 🔑 Admin |
| `PUT` | `/:id` | Update question | 🔑 Admin |
| `DELETE` | `/:id` | Delete question | 🔑 Admin |

<details>
<summary><strong>POST — Body</strong></summary>

```json
{
  "questionText": "What are the solutions of x² − 5x + 6 = 0?",
  "mark": 2,
  "options": [
    { "text": "x = 2, x = 3",   "isCorrect": true  },
    { "text": "x = 1, x = 6",   "isCorrect": false },
    { "text": "x = −2, x = −3", "isCorrect": false },
    { "text": "x = 0, x = 5",   "isCorrect": false }
  ]
}
```

**Invariants enforced by Joi:**
- Minimum **2 options** per question
- Exactly **1 correct** option (`isCorrect: true`)
- `mark` ≥ 1

</details>

---

### 🏃 Exam Attempts — `/exams/:examId/attempts`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/start` | Begin attempt — records `startedAt` | ✅ Student + Enrolled |
| `POST` | `/submit` | Submit answers → auto-grade | ✅ Student + Enrolled |
| `GET` | `/my` | My result for this exam | ✅ Student + Enrolled |
| `GET` | `/` | All attempts (admin view) | 🔑 Admin |

<details>
<summary><strong>POST /submit — Body</strong></summary>

```json
{
  "answers": [
    { "questionId": "65f1a2b3c4d5e6f7a8b9c0d1", "selectedOption": 0 },
    { "questionId": "65f1a2b3c4d5e6f7a8b9c0d2", "selectedOption": 2 }
  ]
}
```

| Rule | Detail |
|------|--------|
| `answers` | Array, min 1 item |
| `selectedOption` | Integer ≥ 0 (zero-indexed into `options[]`) |
| Duplicate questions | Rejected — custom Joi validator checks for duplicate `questionId` values |

</details>

---

### 🎫 Enrollments — `/enrollments`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/courses/:courseId/request` | Request enrollment + upload receipt | ✅ Student |
| `GET` | `/me` | My enrollments | ✅ Student |
| `GET` | `/` | All enrollments (filterable) | 🔑 Admin |
| `POST` | `/manual-assign` | Assign enrollment without payment | 🔑 Admin |
| `PATCH` | `/:id/approve` | Approve pending enrollment | 🔑 Admin |
| `PATCH` | `/:id/cancel` | Cancel enrollment | 🔑 Admin |

Query params for `GET /`: `status` · `studentId` · `courseId`

**Enrollment lifecycle:**

```
         ┌─────────┐
         │ pending │◄── Student requests enrollment
         └────┬────┘
      ┌───────┴────────┐
      ▼                ▼
  ┌────────┐      ┌──────────┐
  │ active │      │ canceled │◄── Admin rejects / cancels
  └────┬───┘      └──────────┘
       │
  (expiresAt reached — auto on next access)
       ▼
  ┌─────────┐
  │ expired │
  └─────────┘
```

> Upload `paymentScreenshot` as `multipart/form-data`. Auto-resized to **1400 × 1400 px**.

---

## 🗄 Data Models

<details>
<summary><strong>User</strong></summary>

```typescript
{
  fullName:               string   // 3–50 chars
  email:                  string   // unique
  phone:                  string   // Egyptian mobile, unique
  password:               string   // bcrypt hash, never returned
  gender:                 "male" | "female"
  educationLevel:         "first_secondary" | "second_secondary" | "third_secondary"
  parentPhone:            string
  governorate:            string
  role:                   "student" | "admin"   // default: "student"
  active:                 boolean               // default: true
  passwordResetCode?:     string                // hashed 6-digit OTP
  passwordResetExpires?:  Date
  passwordResetVerified?: boolean
}
```

</details>

<details>
<summary><strong>Track</strong></summary>

```typescript
{
  name:           string
  description?:   string
  coverImage?:    string   // /uploads/tracks/tracks-{timestamp}.jpeg
  educationLevel: "1st_secondary" | "2nd_secondary" | "3rd_secondary"
  active:         boolean
}
```

</details>

<details>
<summary><strong>Course</strong></summary>

```typescript
{
  title:            string
  description?:     string
  price:            number      // 0 = free, skips enrollment guard
  track:            ObjectId    // → Track
  durationInWeeks?: number
  coverImage?:      string      // /uploads/courses/courses-{timestamp}.jpeg
  isPublished:      boolean
  active:           boolean
}
```

</details>

<details>
<summary><strong>Week</strong></summary>

```typescript
{
  title:        string
  order:        number     // display order within the course
  description?: string
  course:       ObjectId   // → Course
  active:       boolean
}
```

</details>

<details>
<summary><strong>Lesson</strong></summary>

```typescript
{
  title:        string
  description?: string
  type:         "video" | "pdf" | "exam" | "assignment"
  weekId:       ObjectId   // → Week
  contentUrl?:  string     // URL for video / path for PDF
  order:        number
  isFree:       boolean    // free preview — enrollment guard bypassed
  isPublished:  boolean
}
```

</details>

<details>
<summary><strong>Exam</strong></summary>

```typescript
{
  title:           string
  duration:        number     // minutes
  totalMarks:      number
  courseId:        ObjectId   // → Course
  weekId?:         ObjectId   // → Week (optional)
  availableFrom?:  Date
  availableUntil?: Date       // must be > availableFrom
  isPublished:     boolean
}
```

</details>

<details>
<summary><strong>Question</strong></summary>

```typescript
{
  questionText: string
  options: Array<{
    text:      string
    isCorrect: boolean   // exactly one must be true per question
  }>
  mark:   number     // ≥ 1
  examId: ObjectId   // → Exam
}
```

</details>

<details>
<summary><strong>ExamAttempt</strong></summary>

```typescript
{
  examId:    ObjectId
  studentId: ObjectId
  answers: Array<{
    questionId:     ObjectId
    selectedOption: number    // zero-indexed into options[]
  }>
  score:        number   // auto-calculated on submit
  startedAt:    Date
  submittedAt?: Date
}
```

</details>

<details>
<summary><strong>Enrollment</strong></summary>

```typescript
{
  studentId:          ObjectId
  courseId:           ObjectId
  status:             "pending" | "active" | "canceled" | "expired"
  paymentScreenshot?: string   // /uploads/payment-proofs/...
  enrolledAt?:        Date
  expiresAt?:         Date     // null = never expires
}
```

</details>

---

## 🛡 Permission Matrix

| Resource | Public | Student (unenrolled) | Student (enrolled) | Admin |
|----------|:------:|:--------------------:|:------------------:|:-----:|
| Browse tracks & courses | ✅ | ✅ | ✅ | ✅ |
| Course / week details | ✅ | ✅ | ✅ | ✅ |
| Week content & lessons | ❌ | ❌ | ✅ | ✅ |
| Exam questions | ❌ | ❌ | ✅ | ✅ |
| Start & submit exam | ❌ | ❌ | ✅ | ❌ |
| View own exam results | ❌ | ❌ | ✅ | ✅ |
| Request enrollment | ❌ | ✅ | — | — |
| Approve / cancel enrollment | ❌ | ❌ | ❌ | ✅ |
| CRUD all content | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

---

## 🧰 Error Handling

All errors are forwarded to the global error middleware:

```
Development  →  { success, message, stack, error }
Production   →  { success, message }    ← no stack trace leaked
```

Errors created with the internal `ApiError` class are flagged as operational and expose their Arabic message in production. Anything unexpected returns a generic safe message.

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Validation failed (Joi) |
| `401` | Missing or invalid token |
| `403` | Wrong role / not enrolled / enrollment expired |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| MongoDB | ≥ 7 |
| npm | ≥ 9 |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mahmoud-atta1/Al-burhan-platform.git
cd Al-burhan-platform/backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# then edit .env with your values
```

### Environment Variables

```dotenv
# ── Server ─────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# ── Database ────────────────────────────────────────────────────────
DB_URI=mongodb://localhost:27017/al-burhan
DB_SERVER_SELECTION_TIMEOUT_MS=5000

# ── Authentication ──────────────────────────────────────────────────
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
JWT_EXPIRES_IN=30d

# ── Email  (password reset OTP) ─────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password_not_your_account_password

# ── Uploads ─────────────────────────────────────────────────────────
MAX_FILE_SIZE=5242880    # 5 MB in bytes
```

### Running

```bash
# Development — auto-reloads on file changes
npm run dev

# Production
npm start
```

API is now available at **`http://localhost:3000/api/v1`**

### Upload Directories

The server creates these on first use — no manual setup needed:

```
uploads/
├── tracks/            # track cover images
├── courses/           # course cover images
├── lessons/           # lesson PDFs
└── payment-proofs/    # enrollment payment screenshots
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT sign & verify |
| `bcryptjs` | Password hashing |
| `joi` | Request validation (Arabic error messages) |
| `multer` | Multipart file upload handling |
| `sharp` | Image resize & JPEG compression |
| `nodemailer` | Password-reset transactional emails |
| `express-rate-limit` | Login & reset endpoint brute-force protection |
| `express-async-handler` | Clean async error forwarding to Express |
| `dotenv` | Environment variable injection |

---

## 🤝 Contributing

Contributions are welcome!

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. **Open a Pull Request**

Please keep all validation error messages in Arabic to stay consistent with the student-facing interface.

---

<div align="center">

Built with ❤️ for Egyptian students

<br />

**[⬆ Back to top](#-al-burhan-platform)**

</div>
