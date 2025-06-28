import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(dbPath);

export async function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      db.serialize(() => {
        // Error counter for tracking failed operations
        let errorCount = 0;
        const handleError = (err: Error | null, operation: string) => {
          if (err) {
            console.error(`Database error during ${operation}:`, err);
            errorCount++;
            if (errorCount >= 3) { // Fail after multiple errors
              reject(new Error(`Multiple database errors occurred. Last error: ${err.message}`));
              return;
            }
          }
        };

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
        `, (err) => handleError(err, 'users table creation'));

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
        `, (err) => handleError(err, 'match_requests table creation'));

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
        `, (err) => handleError(err, 'feedback table creation'));

        // Create indexes for better performance
        const indexes = [
          { name: 'idx_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
          { name: 'idx_users_role', sql: 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)' },
          { name: 'idx_match_requests_mentor', sql: 'CREATE INDEX IF NOT EXISTS idx_match_requests_mentor ON match_requests(mentor_id)' },
          { name: 'idx_match_requests_mentee', sql: 'CREATE INDEX IF NOT EXISTS idx_match_requests_mentee ON match_requests(mentee_id)' },
          { name: 'idx_match_requests_status', sql: 'CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests(status)' },
          { name: 'idx_feedback_match_request', sql: 'CREATE INDEX IF NOT EXISTS idx_feedback_match_request ON feedback(match_request_id)' },
          { name: 'idx_feedback_reviewer', sql: 'CREATE INDEX IF NOT EXISTS idx_feedback_reviewer ON feedback(reviewer_id)' },
          { name: 'idx_feedback_reviewee', sql: 'CREATE INDEX IF NOT EXISTS idx_feedback_reviewee ON feedback(reviewee_id)' }
        ];

        indexes.forEach(({ name, sql }) => {
          db.run(sql, (err) => handleError(err, `${name} index creation`));
        });

        // Final callback to resolve/reject
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('Failed to enable foreign keys:', err);
            reject(err);
          } else if (errorCount === 0) {
            console.log('Database tables created successfully');
            resolve();
          }
          // If there were errors, they would have already triggered reject
        });
      });

      db.on('error', (err) => {
        console.error('Database connection error:', err);
        reject(err);
      });

    } catch (error) {
      console.error('Failed to initialize database:', error);
      reject(error);
    }
  });
}
