# Personal Journal Frontend (React)

A functional UI for authentication and journal entry management, styled with the Ocean Professional theme.

## Features
- Email/password authentication (login/register)
- Create, list, edit, and delete journal entries
- Central API client with CORS-friendly fetch and env-configurable base URL
- Clean, modern Ocean Professional theme with responsive layout

## Configuration
- Backend base URL is read from:
  - REACT_APP_API_BASE (preferred in CRA)
  - VITE_API_BASE (fallback support)
  - Defaults to http://localhost:3001 if not set
- Copy `.env.example` to `.env` and adjust as needed.

Example:
```
REACT_APP_API_BASE=http://localhost:3001
```

Ensure the backend FastAPI server has CORS enabled for the frontend origin.

## Scripts
- `npm start` — start development server at http://localhost:3000
- `npm test` — run tests
- `npm run build` — build for production

## Notes
- If the backend env is missing, the UI will still load and show the resolved API base in the header.
- Fetch requests include `credentials: "include"` and `mode: "cors"` to align with common FastAPI CORS setups.
