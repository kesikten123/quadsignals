-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  approved_by INTEGER
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Signals table (주가 시그널)
CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_code TEXT NOT NULL,
  stock_name TEXT NOT NULL,
  market TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  price REAL,
  target_price REAL,
  stop_loss REAL,
  strength INTEGER DEFAULT 50,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- News cache table
CREATE TABLE IF NOT EXISTS news_cache (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  pub_date DATETIME,
  related_stocks TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user (password: Admin@1234)
INSERT OR IGNORE INTO users (username, password_hash, name, phone, email, role, status)
VALUES ('admin', '$2a$10$admin_hash_placeholder', 'Administrator', '010-0000-0000', 'admin@quadsignals.com', 'admin', 'approved');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_market ON signals(market);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_news_pub_date ON news_cache(pub_date);
