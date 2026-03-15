# CarbonLens

## Setup

### Frontend (React + Vite)

```bash
cd frontend
npm install --legacy-peer-deps
```

Use `--legacy-peer-deps` because `@tailwindcss/vite` does not yet declare support for Vite 8.

### Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

**Terminal 1 – backend**

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload
```

**Terminal 2 – frontend**

```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:8000 (docs at http://localhost:8000/docs)
