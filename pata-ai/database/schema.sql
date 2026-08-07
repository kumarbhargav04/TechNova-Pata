-- PataAI PostgreSQL + PostGIS Database Schema
-- Production Ready Configuration

-- Enable PostGIS extension for spatial analysis
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    role VARCHAR(50) DEFAULT 'Driver', -- Admin, Manager, Driver
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. API Keys Table for Developer Portal
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    rate_limit_rpm INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Address Requests Logs Table
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    original_address TEXT NOT NULL, -- Will store masked address for privacy (DPDP compliance)
    normalized_address TEXT,
    location GEOMETRY(Point, 4326), -- PostGIS Point geometry (SRID 4326 - WGS84)
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    latency_ms DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'success',
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index on coordinates for ultra-fast nearby geocoding queries
CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses USING gist(location);

-- 4. Verification Evidence Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    address_id INTEGER REFERENCES addresses(id) ON DELETE CASCADE,
    agent_name VARCHAR(100) NOT NULL, -- Language Agent, OSM Agent, etc.
    description TEXT NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Landmark Cache Table
CREATE TABLE IF NOT EXISTS landmarks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    pincode VARCHAR(6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_landmarks_location ON landmarks USING gist(location);
CREATE INDEX IF NOT EXISTS idx_landmarks_name ON landmarks(name);

-- 6. Pincode Master Database
CREATE TABLE IF NOT EXISTS pincode_master (
    pincode VARCHAR(6) PRIMARY KEY,
    office VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    location GEOMETRY(Point, 4326),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pincode_location ON pincode_master USING gist(location);

-- 7. Analytics Metrics Table
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE DEFAULT CURRENT_DATE,
    total_requests INTEGER DEFAULT 0,
    avg_confidence DOUBLE PRECISION DEFAULT 0.0,
    avg_latency_ms DOUBLE PRECISION DEFAULT 0.0,
    calls_saved INTEGER DEFAULT 0,
    fuel_saved_litres DOUBLE PRECISION DEFAULT 0.0,
    co2_reduced_kg DOUBLE PRECISION DEFAULT 0.0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_date ON analytics_metrics(metric_date);
