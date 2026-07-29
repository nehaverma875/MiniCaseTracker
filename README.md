# Mini Case Tracker

A responsive MERN app for replacing a spreadsheet-based ops workflow. Managers create and assign cases, agents upload documents and notes, and managers review submitted work as Cleared or Discrepant.

## Stack

- React + Vite + Material UI
- React Router DOM
- Redux Toolkit + RTK Query
- React Hook Form
- Day.js
- React Hot Toast
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Local file uploads with Multer

## Features

- JWT login with Manager and Agent roles
- Server-side role checks and validation on writes
- Case status flow enforced by the API: `New -> Assigned -> In Progress -> Submitted -> Cleared / Discrepant`
- Audit log for every status change
- Manager case creation, assignment, review, and verdict notes
- Agent-only assigned case list, document upload, notes, and submission
- Search, status filter, agent filter for managers, and pagination
- Case detail page with timeline, comments, documents, and audit log
- Responsive UI for phone, tablet, laptop, and desktop
- Centralized API cache and mutations with RTK Query
- Client-side form handling with React Hook Form
- Consistent date formatting with Day.js
- Toast feedback for login, create case, upload, comments, assignment, and verdict updates
- Seeded test credentials
- Postman collection and backend Dockerfile included

## Test Credentials

| Role | Email | Password |
| --- | --- | --- |
| Manager | `manager@test.com` | `password` |
| Agent | `agent@test.com` | `password` |
| Agent | `priya@test.com` | `password` |

## Local Setup

1. Install Node.js 22 or newer and MongoDB locally, or use MongoDB Atlas.
   If you use Docker, start MongoDB with:

```bash
docker compose up -d mongo
```

2. Install dependencies:
```bash
npm install
npm run install:all
```

3. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. Update `server/.env` if your MongoDB URI differs.
5. Seed demo users and cases:

```bash
npm run seed
```

6. Start both apps:

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend health: http://localhost:5001/api/health

## Environment Variables

Backend:

```bash
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/mini_case_tracker
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=src/uploads
```

Frontend:

```bash
VITE_API_URL=http://localhost:5001/api
VITE_UPLOAD_BASE_URL=http://localhost:5001
```

## Deployment Notes

Backend on Render/Railway/Fly:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, and `UPLOAD_DIR`
- Local uploads are fine for the assignment. For production, move uploads to S3, Cloudinary, or similar persistent object storage.

Frontend on Vercel/Netlify:

- Root directory: `client`
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to the deployed backend API URL plus `/api`
- Set `VITE_UPLOAD_BASE_URL` to the deployed backend base URL

MongoDB:

- Use MongoDB Atlas free tier for deployment.
- Run the seed command once against Atlas by setting `MONGO_URI` locally or in the backend shell.

## Assumptions

- Managers can create a case without assigning it. It remains `New` until assigned.
- Agents can only see and mutate cases assigned to them.
- Uploads are limited to PDF, JPG, PNG, and WebP files up to 8MB.
- Uploading a document as an agent automatically starts work if the case is still `Assigned`.
- A submitted case must have at least one uploaded document.
- Discrepant cases can be reassigned by a manager and worked again.

## Rough Hours Spent

Approximately 7-9 hours for planning, implementation, validation, UI responsiveness, docs, and verification.
