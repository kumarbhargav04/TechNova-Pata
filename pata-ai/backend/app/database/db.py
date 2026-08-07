import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pata_ai.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Driver")  # Admin, Manager, Driver
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    requests = relationship("AddressRequest", back_populates="user")

class AddressRequest(Base):
    __tablename__ = "address_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_address = Column(String, nullable=False)
    normalized_address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    evidence = relationship("EvidenceLog", back_populates="request", cascade="all, delete-orphan")
    user = relationship("User", back_populates="requests")

class EvidenceLog(Base):
    __tablename__ = "evidence_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("address_requests.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=False)
    description = Column(String, nullable=False)
    score = Column(Float, nullable=False)

    request = relationship("AddressRequest", back_populates="evidence")

class PincodeMaster(Base):
    __tablename__ = "pincode_master"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pincode = Column(String, index=True, nullable=False)
    office = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

class LandmarkCache(Base):
    __tablename__ = "landmark_cache"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    resolved_locality = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
