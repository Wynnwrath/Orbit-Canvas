# Orbit Canvas — Production Deployment Guide

This guide covers deploying **Orbit Canvas** using Docker Compose (VPS/Self-hosted) or Railway / Render / Fly.io.

---

## 🛑 Railway Error: "No start command detected" — How to Fix

If Railway gives the error:
`✖ No start command detected. Specify a start command:`

This happens because Railway defaulted to Nixpacks/Railpack on the root folder instead of using the Dockerfiles or subfolder start scripts.

### **Fix in Railway Dashboard (2 Steps)**:

#### **Service 1: Backend Server**
1. In Railway, click on your deployed repo service → **Settings**.
2. Under **General** → set **Root Directory** to `/server`.
3. Under **Build** → set **Build Pack** to **Dockerfile** (it will auto-detect `server/Dockerfile`).
4. Under **Variables**, add:
   - `PORT`: `5000`
   - `MONGO_URI`: `${{MongoDB.MONGO_URL}}` (from Railway MongoDB plugin)
   - `GEMINI_API_KEY`: `your_key_here` (optional)

#### **Service 2: Frontend Client**
1. Click **+ New Service** → **GitHub Repo** → select `orbit-canvas`.
2. In **Settings** → set **Root Directory** to `/client`.
3. Under **Build** → set **Build Pack** to **Dockerfile** (it will auto-detect `client/Dockerfile`).
4. Railway will build Nginx and assign a domain automatically!

---

## ⚡ Quick Deployment Summary

### **Option 1: Railway (PaaS)**
- Root `package.json` now includes `"start": "npm --prefix server start"`.
- Set service root directories to `/server` and `/client` in Railway settings.

### **Option 2: Docker Compose (VPS / Self-Hosted)**
```bash
git clone https://github.com/your-username/orbit-canvas.git
cd orbit-canvas

echo "GEMINI_API_KEY=your_key_here" > .env
docker compose up --build -d
```
