# PataAI - AI Powered Address Intelligence

PataAI transforms messy, unstructured Indian addresses (containing landmarks, regional scripts, spelling typos, and wrong pincodes) into highly accurate geographic coordinates using a LangGraph multi-agent system under 500ms.

## Screenshots

### Landing Page
![Landing Page](./assets/landing_page.png)

### Dashboard (9-Agent Cooperative StateGraph)
![Dashboard](./assets/dashboard.png)

### Settings (Cooperative Agent Parameters)
![Settings](./assets/settings.png)

### Sign In
![Sign In](./assets/sign_in.png)

### Route Planner
![Route Planner](./assets/route_planner.png)

## Overview

PataAI uses a 9-Agent Cooperative StateGraph to process complex addresses:
1. **Language Agent**
2. **Normalization Agent**
3. **Parser Agent**
4. **Pincode Agent**
5. **OSM Search (Landmark Agent)**
6. **Semantic Agent**
7. **Resolution Agent**
8. **Self-Check (Validation Agent)**
9. **Evidence Agent**

## Tech Stack
- **AI/LLM:** Google Gemini via `google-generativeai`
- **Backend:** FastAPI, Python, SQLAlchemy, httpx, asyncio
- **Frontend:** Next.js, React, TailwindCSS
- **Geocoding:** OSM Overpass API, LocationIQ

## Getting Started
*Instructions for running the project will go here.*
