# EduManage - Student Management System

React (Vite) frontend + Node/Express backend + MongoDB.

## Requirements
- Node.js 18 or newer
- MongoDB running locally (default: mongodb://127.0.0.1:27017) or a MongoDB Atlas URI

## Setup (VS Code terminal, inside this folder)
```
npm run install-all
npm run dev
```
- Frontend: http://localhost:5177
- Backend:  http://localhost:5000  (health check: /api/health)

Or run separately in two terminals:
```
cd backend  && npm install && npm start
cd frontend && npm install && npm run dev
```

## Logins
- Admin: open the "Admin Login" tab -> User ID `sadmin`, Password `sadmin`
  (created automatically in MongoDB when the backend starts)
- User: click "Create an account" on the login page, then use "User Login"

## Permissions
| Action            | Admin | User |
|-------------------|:-----:|:----:|
| View dashboard    |  yes  | yes  |
| View/search students | yes | yes |
| Edit students     |  yes  | yes  |
| Add students      |  yes  |  no  |
| Delete students   |  yes  |  no  |

## New features
- **Date of Joining** - added to the student form (Add/Edit) and the student table; stored in MongoDB.
- **Attendance** (sidebar -> Attendance)
  - *Mark Attendance*: pick a date, filter by department/year, set each student **Present** or **Absent** (or use All Present / All Absent) and click Save. Re-opening a date shows the saved values and lets you correct them.
  - *Monthly Register*: grid of P / A per day for every student with present, absent and % totals.
- **Exam Schedule** (sidebar -> Exam Schedule): date, time, subject, type, department, year, venue, with search and Upcoming / Completed filter and a status badge.

| Action | Admin | User |
|--------|:-----:|:----:|
| Mark attendance / view register | yes | yes |
| View exam schedule | yes | yes |
| Add / edit / delete exams | yes | no |

New MongoDB collections `attendances` and `exams` are created automatically. Existing students keep working; those without a joining date show "-" until edited.

## Configuration
Edit `backend/.env` (PORT, MONGO_URI, JWT_SECRET, ADMIN_ID, ADMIN_PASSWORD).
For MongoDB Atlas, replace MONGO_URI with your connection string.
