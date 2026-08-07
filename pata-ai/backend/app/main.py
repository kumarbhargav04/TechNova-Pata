import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.database.db import init_db, SessionLocal, PincodeMaster
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="PataAI API",
    description="AI-powered Indian Address Intelligence System for Last-Mile Delivery",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    print("Initializing Database...")
    init_db()
    
    # Programmatic seeding if database is empty
    db = SessionLocal()
    if db.query(PincodeMaster).count() < 100:
        print("Database not fully seeded. Running automatic seeding...")
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from seed_db import seed
        try:
            seed()
        except Exception as e:
            print(f"Automatic seeding failed: {e}")
    else:
        print("Database is already seeded with pincodes.")
    db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "PataAI Address Resolution Engine",
        "version": "1.0.0"
    }
