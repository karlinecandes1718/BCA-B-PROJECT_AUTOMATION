# Backend Overview and Frontend Connection

## 1. Project Purpose

This project has a frontend built with Next.js and a backend built with Express.js. The backend is responsible for:

- authenticating the admin user
- validating and processing requests
- communicating with the Gemini AI service
- returning safe and structured data to the frontend

The frontend uses the backend through HTTP API requests, so the backend acts as the server-side logic layer for the application.

---

## 2. Backend Folder Structure

The backend folder contains the following main areas:

- `config/` – environment configuration and validation
- `routes/` – API route handlers
- `services/` – business logic and AI integration
- `types/` – shared TypeScript interfaces

### Main files

- `backend/index.ts` – server entry point
- `backend/routes/auth.ts` – admin authentication route
- `backend/routes/keywords.ts` – keyword generation route
- `backend/services/keywordProcessor.ts` – orchestration layer
- `backend/services/geminiService.ts` – Gemini AI integration
- `backend/types/keyword.ts` – shared data types
- `backend/config/env.ts` – environment validation

---

## 3. Backend Entry Point

The file [backend/index.ts](backend/index.ts) is the main server file.

### What it does

- starts the Express server
- enables JSON parsing
- enables CORS for the frontend
- registers API routes
- provides a health check endpoint
- handles errors globally

### Important features

- It loads environment variables and validates them before the server fully starts.
- It exposes the following routes:
  - `GET /health`
  - `POST /api/auth/admin`
  - `POST /api/keywords`

### Why it matters

This file is the backbone of the backend because every request passes through it before reaching the appropriate handler.

---

## 4. Environment Configuration

The file [backend/config/env.ts](backend/config/env.ts) validates required environment variables.

### What it checks

- `GEMINI_API_KEY` – required for AI calls
- `ADMIN_PASSWORD` – required for admin auth
- `PORT` – server port, default is `5000`
- `NODE_ENV` – environment mode such as development or production

### Why this is important

If required values are missing or invalid, the backend stops safely and shows a clear validation error. This prevents the server from starting with broken configuration.

---

## 5. Authentication Route

The file [backend/routes/auth.ts](backend/routes/auth.ts) handles admin authentication.

### Endpoint

- `POST /api/auth/admin`

### What it accepts

It expects a JSON body containing:

```json
{
  "password": "your-admin-password"
}
```

### What it does

- validates that a password is provided
- compares the submitted password to the server-side stored admin password
- returns either:
  - success response if the password is correct
  - error response if it is incorrect or missing

### Security behavior

- the password is never exposed back to the client
- the backend compares the password securely rather than leaking details

---

## 6. Keyword Processing Route

The file [backend/routes/keywords.ts](backend/routes/keywords.ts) handles SEO keyword generation.

### Endpoint

- `POST /api/keywords`

### What it accepts

The request can contain:

- `text` – raw text input
- `image` – base64-encoded image data

Example payload:

```json
{
  "text": "seo, nextjs, react",
  "image": {
    "mimeType": "image/jpeg",
    "data": "base64-string"
  }
}
```

### Validation performed here

- at least one input must be provided
- image format must be `image/jpeg`
- image data must be a valid base64 string
- text input cannot exceed 100 words

### What happens after validation

The route passes the data to the keyword processor service, which then communicates with Gemini.

---

## 7. Keyword Processor Service

The file [backend/services/keywordProcessor.ts](backend/services/keywordProcessor.ts) acts as an intermediate layer.

### Role

It receives the validated input and prepares it for the AI service. Its job is to:

- validate that input exists
- call the Gemini service
- ensure the response is a clean array of keyword results
- remove unnecessary metadata and keep only safe fields

### Why it exists

This layer prevents the route from directly depending on the AI service implementation details. It keeps the code organized and makes the backend easier to maintain.

---

## 8. Gemini AI Integration

The file [backend/services/geminiService.ts](backend/services/geminiService.ts) is the core AI layer.

### What it does

- connects to Google Gemini using the official SDK
- sends the text/image input to the model
- requests a structured JSON response
- parses the response into typed keyword results

### Supported behavior

The service can handle three input modes:

1. keywords only
2. image only
3. hybrid input (keywords + image)

### Output format

Each result contains:

- `keyword`
- `description`
- `summary`

This makes the output suitable for the frontend UI.

### Safety behavior

The service is designed to:

- reject invalid or missing input
- handle image-read failures gracefully
- avoid leaking API secrets in error messages

---

## 9. Shared Types

The file [backend/types/keyword.ts](backend/types/keyword.ts) defines the data model used across the backend.

### Main interfaces

- `KeywordResult` – one analyzed keyword item
- `KeywordsApiResponse` – successful API response envelope
- `KeywordsApiErrorResponse` – error response envelope

These interfaces help keep the backend response format predictable and consistent.

---

## 10. How the Frontend Connects to the Backend

The frontend communicates with the backend over HTTP requests using `fetch`.

### Frontend files involved

- [frontend/src/utils/api.ts](frontend/src/utils/api.ts)
- [frontend/src/app/page.js](frontend/src/app/page.js)

---

## 11. Frontend-to-Backend Flow for Keyword Generation

The file [frontend/src/utils/api.ts](frontend/src/utils/api.ts) contains the `generateKeywords()` function.

### What it does

- builds the API request URL
- sends the request to `POST /api/keywords`
- waits for the backend response
- returns keyword data to the frontend

### Example flow

1. The user enters text or uploads an image in the UI.
2. The frontend calls `generateKeywords()`.
3. The frontend sends the request to the backend.
4. The backend processes the request with Gemini.
5. The backend sends structured keyword results back.
6. The frontend displays those results.

### API base URL

The frontend uses:

- `NEXT_PUBLIC_API_URL` if available
- otherwise it falls back to `http://localhost:5000`

This means the frontend expects the backend to be running on port `5000` during development.

---

## 12. Frontend-to-Backend Flow for Admin Login

The file [frontend/src/app/page.js](frontend/src/app/page.js) handles admin login.

### What it does

- collects the admin password from the login page
- sends the password to `POST /api/auth/admin`
- checks whether the backend accepts the credentials
- redirects the user accordingly

### Flow

1. User enters password in the admin form.
2. The frontend sends it to the backend.
3. The backend validates it.
4. The frontend receives success or failure.
5. The UI behaves accordingly.

---

## 13. Why the Backend Exists in This Project

The backend exists because the frontend alone cannot safely or efficiently perform all of the following:

- protect admin credentials
- keep API keys secure
- call external AI services
- process sensitive data on the server side

This separation makes the app more secure and better organized.

---

## 14. Simple Architecture Summary

```text
User -> Frontend (Next.js)
        -> HTTP request to backend
Backend (Express.js)
        -> validates request
        -> routes to auth or keywords logic
        -> calls Gemini AI service
        -> returns structured JSON response
Frontend displays the result
```

---

## 15. Final Summary

The backend folder is responsible for the server-side logic of the application. It:

- handles admin authentication
- processes keyword generation requests
- communicates with Gemini AI
- validates and sanitizes requests
- returns safe structured data to the frontend

The frontend connects to the backend through API routes, especially:

- `/api/auth/admin` for admin login
- `/api/keywords` for keyword generation

This makes the project a clean full-stack application where the frontend handles the user interface and the backend handles logic, security, and AI integration.
