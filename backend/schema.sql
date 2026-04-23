-- Create database (only if not exists)
-- CREATE DATABASE pcb_manufacturing;

-- Connect to database
-- \c pcb_manufacturing;

-- Create enum types
CREATE TYPE user_role AS ENUM ('operator', 'supervisor', 'admin');
CREATE TYPE board_status AS ENUM ('created', 'in_progress', 'completed', 'on_hold');
CREATE TYPE step_status AS ENUM ('in_progress', 'done', 'failed');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'operator',
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY,
    board_id VARCHAR(50) UNIQUE NOT NULL,
    status board_status DEFAULT 'created',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process steps table
CREATE TABLE IF NOT EXISTS process_steps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Board logs table
CREATE TABLE IF NOT EXISTS board_logs (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES process_steps(id),
    user_id INTEGER REFERENCES users(id),
    status step_status DEFAULT 'in_progress',
    comment TEXT,
    image_path VARCHAR(500),
    defect_description TEXT,
    repair_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Schema for PCB Manufacturing Tracker

-- Users table with department
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('operator', 'supervisor', 'manager', 'admin')),
    department VARCHAR(50),
    employee_id VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hashed_password VARCHAR(255) NOT NULL
);

-- Machines table
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    machine_code VARCHAR(50) UNIQUE NOT NULL,
    machine_name VARCHAR(100) NOT NULL,
    machine_type VARCHAR(50),
    location VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('available', 'in_use', 'maintenance', 'offline')),
    last_maintenance DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boards table
CREATE TABLE boards (
    id SERIAL PRIMARY KEY,
    board_id VARCHAR(50) UNIQUE NOT NULL,
    board_name VARCHAR(100),
    batch_number VARCHAR(50),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) CHECK (status IN ('created', 'assigned', 'in_progress', 'pending_review', 'completed', 'rejected', 'on_hold')),
    current_step_id INTEGER REFERENCES process_steps(id),
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_days INTEGER DEFAULT 1,
    actual_days INTEGER,
    completed_at TIMESTAMP
);

-- Process steps with department mapping
CREATE TABLE process_steps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(50),
    display_order INTEGER NOT NULL,
    estimated_hours INTEGER DEFAULT 4,
    requires_review BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Board logs (enhanced)
CREATE TABLE board_logs (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES process_steps(id),
    user_id INTEGER REFERENCES users(id),
    machine_id INTEGER REFERENCES machines(id),
    assigned_to INTEGER REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('in_progress', 'done', 'failed', 'pending_review', 'reviewed', 'rework')),
    comment TEXT,
    defect_description TEXT,
    repair_action TEXT,
    time_spent_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images table (multiple images per log)
CREATE TABLE board_images (
    id SERIAL PRIMARY KEY,
    log_id INTEGER REFERENCES board_logs(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    image_type VARCHAR(20) CHECK (image_type IN ('before', 'after', 'defect', 'general')),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table (manager reviews)
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    log_id INTEGER REFERENCES board_logs(id),
    reviewer_id INTEGER REFERENCES users(id),
    status VARCHAR(20) CHECK (status IN ('approved', 'rejected', 'needs_rework')),
    comment TEXT,
    action_required TEXT,
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    board_id INTEGER REFERENCES boards(id),
    boards_completed INTEGER DEFAULT 0,
    boards_failed INTEGER DEFAULT 0,
    avg_time_minutes INTEGER,
    success_rate DECIMAL(5,2),
    week_start DATE,
    week_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert default process steps
INSERT INTO process_steps (name, display_order) VALUES
('Soldering', 1),
('Optical Inspection', 2),
('X-Ray Inspection', 3),
('Testing', 4),
('Repair', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, full_name, role, hashed_password) VALUES
('admin', 'admin@pcb.com', 'System Administrator', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIqOVoYz5u')
ON CONFLICT (username) DO NOTHING;