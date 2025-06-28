import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee')),
          bio TEXT,
          image_data BLOB,
          image_type TEXT,
          skills TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Match requests table
      db.run(`
        CREATE TABLE IF NOT EXISTS match_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mentor_id INTEGER NOT NULL,
          mentee_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Feedback table
      db.run(`
        CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          match_request_id INTEGER NOT NULL,
          reviewer_id INTEGER NOT NULL,
          reviewee_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (match_request_id) REFERENCES match_requests(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(match_request_id, reviewer_id)
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_match_requests_mentor ON match_requests(mentor_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_match_requests_mentee ON match_requests(mentee_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_match_request ON feedback(match_request_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_reviewer ON feedback(reviewer_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_reviewee ON feedback(reviewee_id)`);

      console.log('Database tables created successfully');
      resolve();
    });

    db.on('error', (err) => {
      console.error('Database error:', err);
      reject(err);
    });
  });
}
