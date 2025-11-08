# HMH Content Management System - Local Development Setup

## Quick Start Guide

Your local development environment is now set up and ready to use! Here's everything you need to know.

---

## Current Status

✅ **Backend Server**: Running on [http://localhost:8000](http://localhost:8000)
✅ **Frontend Server**: Running on [http://localhost:3000](http://localhost:3000)
✅ **Python Virtual Environment**: Created in `backend/venv/`
✅ **Environment Files**: Configured with secure secrets
✅ **Git Protection**: All sensitive files are in .gitignore

---

## Access Information

### Frontend Application
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Login Email**: `admin@hmhco.com`
- **Login Password**: `changeme`

### Backend API
- **URL**: [http://localhost:8000](http://localhost:8000)
- **API Docs (Swagger)**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **API Docs (ReDoc)**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

---

## Starting the Servers (Easy Method)

### Option 1: Double-Click Batch Files

1. **Start Backend**: Double-click `start-backend.bat` in the project root
2. **Start Frontend**: Double-click `start-frontend.bat` in the project root

### Option 2: Command Line

**Backend:**
```bash
cd backend
venv\Scripts\activate
python main.py
```

**Frontend (in a separate terminal):**
```bash
cd frontend
npm run dev
```

---

## Stopping the Servers

### If using Batch Files:
- Press `Ctrl+C` in each terminal window
- Or simply close the terminal windows

### If using Command Line:
- Press `Ctrl+C` in each terminal

---

## Virtual Environment Management

### What is the Virtual Environment?

The Python virtual environment (`backend/venv/`) is an isolated Python environment that keeps this project's dependencies separate from your system Python. This prevents conflicts with other projects.

### Activating the Virtual Environment

The batch file does this automatically, but if you need to do it manually:

```bash
cd backend
venv\Scripts\activate
```

You'll see `(venv)` appear in your command prompt when active.

### Deactivating the Virtual Environment

```bash
deactivate
```

### Deleting and Recreating (if needed)

If you encounter issues, you can safely delete and recreate the virtual environment:

```bash
cd backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## Configuration Files

### Backend Configuration (`backend/.env`)

**Location**: `backend/.env`
**Status**: ✅ Created with secure auto-generated secret key
**Git Status**: 🔒 Protected (will NOT be committed to Git)

**Important Settings:**
- `SECRET_KEY`: Auto-generated secure key (DO NOT SHARE!)
- `DATABASE_URL`: Using SQLite for local development
- `FIRST_SUPERUSER_EMAIL`: admin@hmhco.com
- `FIRST_SUPERUSER_PASSWORD`: changeme

**To regenerate the secret key:**
```bash
cd backend
venv\Scripts\python -c "import secrets; print(secrets.token_hex(32))"
```
Then copy the output and update `SECRET_KEY` in `.env`

### Frontend Configuration (`frontend/.env.local`)

**Location**: `frontend/.env.local`
**Status**: ✅ Created
**Git Status**: 🔒 Protected (will NOT be committed to Git)

**Settings:**
- `VITE_API_URL`: http://localhost:8000

---

## Database

### Location
`backend/content.db` (SQLite database)

### Status
Created automatically on first run with the admin user.

### Resetting the Database

If you want to start fresh:

1. Stop the backend server
2. Delete `backend/content.db`
3. Restart the backend server (it will recreate the database)

---

## Installed Components

### Backend (Python)
- **Virtual Environment**: `backend/venv/`
- **Dependencies**: Installed in the virtual environment
  - FastAPI (web framework)
  - SQLAlchemy (database)
  - JWT authentication
  - And 50+ other packages (see `requirements.txt`)

### Frontend (Node.js)
- **Dependencies**: `frontend/node_modules/` (503 packages)
  - React (UI framework)
  - Vite (build tool)
  - TailwindCSS (styling)
  - React Router (navigation)
  - And 500+ other packages (see `package.json`)

---

## Troubleshooting

### Backend won't start

**Check if port 8000 is already in use:**
```bash
netstat -ano | findstr :8000
```

**If port is in use, either:**
1. Stop the process using that port, or
2. Change the port in `backend/main.py`

### Frontend won't start

**Check if port 3000 is already in use:**
```bash
netstat -ano | findstr :3000
```

**If port is in use**, Vite will automatically try port 3001, 3002, etc.

### "Module not found" errors

**Backend:**
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Database errors

Delete the database and let it recreate:
```bash
cd backend
del content.db
```
Then restart the backend server.

### Virtual environment issues

Recreate the virtual environment:
```bash
cd backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

## Updating Dependencies

### Backend
```bash
cd backend
venv\Scripts\activate
pip install --upgrade -r requirements.txt
```

### Frontend
```bash
cd frontend
npm update
```

---

## Security Notes

### ✅ Protected from Git
The following files are automatically protected from being committed to Git:
- `backend/.env` (contains SECRET_KEY)
- `frontend/.env.local` (configuration)
- `backend/venv/` (virtual environment)
- `frontend/node_modules/` (npm packages)
- `backend/content.db` (database)

### 🔒 Never Share These
- Your `backend/.env` file (contains SECRET_KEY)
- Database files
- Virtual environment folders

### 🆗 Safe to Share
- `backend/.env.example` (template without secrets)
- All code files
- Configuration templates

---

## AI Features (Agents, Skills, Workflows)

### What's Available

**22 Autonomous Agents** - AI-powered content development assistants:
- Curriculum Architect (10x productivity)
- Content Developer (5-7x productivity)
- Assessment Designer
- Pedagogical Reviewer
- Quality Assurance
- And 17 more specialized agents

**92 Composable Skills** - Granular AI functions for specific tasks
**Multi-Agent Workflows** - Chain agents together for complex tasks

### How to Use

#### 1. Agents Tab
1. Navigate to **Agents** in the top navigation
2. Browse available agents by category
3. Select an agent (e.g., "Content Developer")
4. Enter your task description
5. Configure parameters (grade level, subject, state, standards)
6. Click "Start Agent"
7. Monitor progress in real-time
8. View and use generated content

**Example**: "Create a 5th grade Texas Math lesson on fractions aligned to TEKS"

#### 2. Skills Tab
1. Navigate to **Skills** in the top navigation
2. Browse the 92 available skills
3. Click "Invoke" on any skill
4. Enter task description and optional context
5. Click "Execute Skill"
6. View results immediately

**Example Skills**:
- curriculum.research - Research subject matter and standards
- curriculum.design - Write learning objectives
- assessment.design-items - Create test questions

#### 3. Workflows Tab
1. Navigate to **Workflows** in the top navigation
2. Browse pre-built workflow templates
3. Create custom workflows
4. Execute multi-step content development pipelines

### Requirements

**For AI features to work**, you need:
- ✅ Anthropic API key configured in `backend/.env`
- ✅ Your API key is already set: `ANTHROPIC_API_KEY=sk-ant-api03...`
- ✅ All fixes applied and servers running

### AI Features Performance

- **Agent execution**: Typically 30 seconds - 3 minutes depending on complexity
- **Skills execution**: Typically 5-30 seconds
- **Timeout**: 5 minutes maximum (automatically enforced)
- **Cost**: ~$0.01-0.50 per agent invocation (varies by task complexity)

---

## Next Steps

1. **Access the application**: Open [http://localhost:3000](http://localhost:3000)
2. **Log in** with: `admin@hmhco.com` / `changeme`
3. **Explore the features**:
   - Browse the 303-file knowledge base
   - **Try the Agents tab** - Invoke an AI agent to create content
   - **Try the Skills tab** - Execute individual AI skills
   - **Try the Workflows tab** - Run multi-step content pipelines
   - Create content manually
   - Manage curriculum configurations
   - Use the search functionality

4. **Change the default password**:
   - Go to Profile page after logging in
   - Update your password
   - This only changes the database password, not the `.env` default

---

## What's Running?

### Backend (FastAPI)
- **Purpose**: REST API server
- **Port**: 8000
- **Features**:
  - User authentication (JWT tokens)
  - Knowledge base browser
  - Content management
  - Search indexing
  - Git integration
  - File uploads

### Frontend (React + Vite)
- **Purpose**: Web interface
- **Port**: 3000
- **Features**:
  - 8 complete pages (Dashboard, Knowledge Base, Content, Reviews, etc.)
  - Responsive design
  - Real-time search
  - Markdown rendering
  - Role-based access control

---

## Need Help?

- **Backend API Documentation**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Project README**: See [README.md](README.md)
- **Author Guide**: See [AUTHOR_GUIDE.md](AUTHOR_GUIDE.md)
- **Engineer Guide**: See [ENGINEER_GUIDE.md](ENGINEER_GUIDE.md)

---

## Clean Up (If Needed)

To completely remove the local development setup:

1. **Stop both servers** (Ctrl+C or close terminals)
2. **Delete virtual environment**: `rmdir /s /q backend\venv`
3. **Delete node_modules**: `rmdir /s /q frontend\node_modules`
4. **Delete database**: `del backend\content.db`
5. **Delete environment files**: `del backend\.env frontend\.env.local`

To set up again, just run through this guide from the beginning!

---

**Setup Date**: 2025-11-07
**Status**: ✅ Complete and Working
**Version**: 1.0.0
