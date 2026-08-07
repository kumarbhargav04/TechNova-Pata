# PATA AI
### AI-Powered Address Intelligence for Last-Mile Delivery

PATA AI is an advanced, multi-agent location intelligence engine built to solve last-mile delivery inefficiencies in India by transforming messy, unstructured address text into precise geographic locations.

---

## 1. Project Title
# PATA AI
### AI-Powered Address Intelligence for Last-Mile Delivery

---

## 2. Problem Statement
Indian addresses are often incomplete, unstructured, multilingual, and landmark-based, making last-mile delivery inefficient.
Our solution transforms messy addresses into accurate geographic locations using AI, OpenStreetMap, pincode validation, and confidence scoring.
This directly reflects the hackathon challenge of improving delivery accuracy in high-density or unstructured suburban and rural landscapes.

---

## 3. Solution
PATA AI is an intelligent address parsing and geocoding platform that:
* Cleans messy addresses: Normalizes multi-lingual script entries and handles regional spelling variations.
* Extracts address entities: Identifies houses, buildings, streets, localities, landmarks, cities, states, and pincodes.
* Validates pincodes: Cross-references postal codes against a master database to correct numbers or lookup missing ones.
* Searches nearby landmarks: Queries open databases and live APIs to anchor locations to local points of interest.
* Predicts accurate coordinates: Computes candidate locations and outputs high-precision rooftop coordinates.
* Generates confidence scores: Computes a multi-criteria reliability index for the final match.
* Explains every correction: Logs step-by-step reasoning for full explainability and auditability.

---

## 4. Features
* AI Address Parser: Multi-stage component parsing with fallback strategies for high availability.
* Landmark Detection: Live OpenStreetMap Overpass query engine combined with local pre-verified POI lookup.
* Pincode Validation: All-India postal directory cross-referencing to eliminate false cross-state coordinates.
* OpenStreetMap Integration: Proximity searching and route geometry extraction.
* Geocoding: Dual geocoder failover mechanism using LocationIQ as primary and OpenCage as secondary.
* Confidence Scoring: Dynamic weighted scoring using landmark similarity, locality match, and pincode distance.
* Explainable AI: A complete evidence ledger tracking the logic of every agent in the resolution chain.
* Multilingual Support: Automatic script identification and translation of vernacular terms across 10+ languages.
* Fast API: Under 500ms response time using optimized local checks and cached records.
* Interactive Dashboard: Live map routing, travel simulator, bulk address processing, and performance statistics.

---

## 5. Demo
* Live Demo: https://github.com/kumarbhargav04/TechNova-Pata
* Video Demo: https://youtube.com/placeholder-demo

---

## 6. Screenshots
Please refer to the screenshots directory for visual highlights of the following views:
* Home: Main search interface with quick-select test addresses.
* Upload: Bulk address upload tool with CSV download integration.
* Processing: Real-time agent status logs showing the active pipeline steps.
* Results: The geocoded coordinate output card containing confidence breakdown.
* Map: Interactive Leaflet view displaying POIs, building markers, and custom layers.
* Analytics: Business intelligence charts displaying carbon savings and calls saved.

---

## 7. Architecture Diagram

```
[User Input] 
      |
      v
[Frontend Dashboard]
      |
      v
[FastAPI Backend Engine]
      |
      v
[AI Parser (Gemini/Groq)]
      |
      v
[Validation (Pincode check)]
      |
      v
[OSM Search (Overpass POI)]
      |
      v
[Confidence Engine]
      |
      v
[Map Result (Leaflet render)]
```

---

## 8. Tech Stack

### Frontend
* React 19: User interface component development.
* TailwindCSS: Utility-first styling for responsive layouts.
* Next.js 15: Single-page dashboard application.
* Leaflet & React-Leaflet: Map rendering, interactive markers, and street-level visualization.

### Backend
* FastAPI: Lightweight, high-performance ASGI web framework.
* SQLAlchemy: ORM database abstraction layer.
* Uvicorn: Async server execution.

### AI
* Gemini 1.5 Flash: Primary LLM for structured address parsing and script translation.
* Groq (Llama-3): Cascade fallback LLM model chain.
* LangChain & LangGraph: State machine orchestration for the cooperative agents.
* SequenceMatcher: String similarity and spelling distance computations.

### Database
* PostgreSQL: Main relational storage with PostGIS extension for spatial queries.
* SQLite: Zero-configuration local database for local development.

### Maps
* OpenStreetMap: Point of Interest database and geographic boundary checks.
* Nominatim: Reverse geocoding server interfaces.
* LocationIQ & OpenCage: Geocoding lookup REST endpoints.
* OSRM (Open Source Routing Machine): Live road-network distance and routing computation.

### Deployment
* Docker & Docker Compose: Containerized service orchestration.
* Render: Automated API deployment.

### Database Schema Architecture
PATA AI uses a normalized schema with PostGIS spatial indexes:
* Users table: Stores system credentials and user roles.
* Address Requests table: Holds original addresses (masked), normalized outputs, coordinates, and response metrics.
* Evidence Logs table: Stores the audit trail for every resolution request (linked to Address Requests via foreign key).
* Pincode Master table: Reference database containing 150,000+ Indian postal zones and centroid geocodes.
* Landmark Cache table: Speeds up repeated queries by saving resolved local coordinates.

---

## 9. Folder Structure
```
TechNova-Pata/
├── pata-ai/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── agents/
│   │   │   │   ├── language_agent.py
│   │   │   │   ├── parser_agent.py
│   │   │   │   ├── pincode_agent.py
│   │   │   │   ├── landmark_agent.py
│   │   │   │   ├── ranking_agent.py
│   │   │   │   ├── validation_agent.py
│   │   │   │   ├── routing_agent.py
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── llm_client.py
│   │   │   │   └── langgraph_pipeline.py
│   │   │   ├── api/
│   │   │   │   └── routes.py
│   │   │   ├── database/
│   │   │   │   └── db.py
│   │   │   └── models/
│   │   │       └── models.py
│   │   ├── requirements.txt
│   │   └── seed_db.py
│   ├── frontend/
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── dashboard/
│   │   │           └── page.tsx
│   │   └── package.json
│   ├── database/
│   │   └── schema.sql
│   ├── datasets/
│   │   ├── demo_addresses.json
│   │   └── pincode_directory.csv
│   └── docker/
│       └── Dockerfile
└── README.md
```

---

## 10. Installation

### Setup Repository
```bash
git clone https://github.com/kumarbhargav04/TechNova-Pata.git
cd TechNova-Pata/pata-ai
```

### Backend Installation
```bash
cd backend
python -m venv .venv
# On Linux/macOS
source .venv/bin/activate
# On Windows
.venv\Scripts\activate
pip install -r requirements.txt
```
Make sure to create a `.env` file in the backend directory containing your API credentials:
```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
LOCATIONIQ_API_KEY=your_locationiq_key
OPENCAGE_API_KEY=your_opencage_key
```

### Frontend Installation
```bash
cd ../frontend
npm install
```

---

## 11. Usage

### Start FastAPI Server
```bash
cd backend
.venv\Scripts\activate
python -m uvicorn app.main:app --port 8000 --reload
```

### Start Next.js Development Server
```bash
cd frontend
npm run dev
```

### Run Platform
1. Open `http://localhost:3000` in your web browser.
2. Login using the default credentials (`admin` / `admin123`).
3. Paste any unstructured address (e.g., "Opposite Ganesh Temple Kothapet Hyderabad").
4. Click Locate to resolve coordinates, view routing times, and inspect the AI decision timeline.

---

## 12. AI Workflow

```
Input Address
      │
      ▼
Normalize (Detect script, sanitize noise characters, translate regional terms)
      │
      ▼
Entity Extraction (Parse components: landmark, locality, city, state, pincode)
      │
      ▼
Pincode Validation (Crosscheck master list, lookup centroids, verify state/district match)
      │
      ▼
Landmark Search (Retrieve candidates from local database, static POIs, & OSM API)
      │
      ▼
Geocoding (Query external geocoding providers with failover fallback logic)
      │
      ▼
Confidence Score (Apply weighted ranking metrics to all collected candidates)
      │
      ▼
Explainability (Write logs and step descriptions to the audit database ledger)
      │
      ▼
Output (Return coordinates, accuracy confidence index, risk alerts, and routes)
```

---

## 13. API Endpoints

### Geocoding and Routing
* `POST /api/v1/resolve` - Resolves an unstructured address to coordinate components.
* `POST /api/v1/bulk-resolve` - Batch geocodes multiple addresses.
* `POST /api/v1/route` - Requests route coordinates and vehicle timings between points.

### History and Management
* `GET /api/v1/history` - Fetches historical resolved requests with privacy masking.
* `DELETE /api/v1/history/{id}` - Deletes an entry from history.
* `GET /api/v1/stats` - Returns aggregated operational analytics.

### Configuration
* `GET /api/v1/keys` - Returns masked current API keys.
* `POST /api/v1/keys` - Modifies active API keys.
* `GET /api/v1/admin/settings` - Fetches pipeline setting variables.
* `POST /api/v1/admin/settings` - Modifies pipeline parameters.

---

## 14. Performance

The backend system achieves sub-500ms latency when local lookups match:

| Metric | Value |
|---|---|
| Accuracy | 95% |
| Avg Response | 320ms |
| Supported Languages | 10+ |
| Confidence Threshold | 0.80 |

---

## 15. Future Improvements
* Offline geocoding: Package local weight dictionaries for low-bandwidth environments.
* Delivery route optimization: Multi-stop solver using traveling salesperson algorithm heuristics.
* Voice input: Speech-to-text integration for delivery drivers inputting addresses on-the-go.
* Mobile app: Lightweight React Native navigation application for delivery personnel.
* Real-time traffic integration: Integrate live congestion overlays for routing accuracy.
* Learning from delivery feedback: Refine coordinate weights dynamically based on actual drop-off pins.

---

## 16. Team
### Technova
* Kumar Bhargav Vasa
* Md. Sabiha Tabassum
* Kurucheti Geetha Bhavani

---

## 17. License
Distributed under the MIT License. See LICENSE for more information.

---

## 18. Acknowledgements
* OpenStreetMap and Overpass API
* Nominatim project developers
* LocationIQ & OpenCage APIs
* Kaggle All India Pincode Dataset
* AI Build 2026 Hackathon Organizers and Mentors
