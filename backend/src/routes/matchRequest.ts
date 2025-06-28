import { Router, Response } from 'express';
import Joi from 'joi';
import { db } from '../database/init';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { MatchRequest, MatchRequestCreate, MatchRequestResponse } from '../types';

const router = Router();

// SQLite types
interface SQLiteError extends Error {
  errno?: number;
  code?: string;
}

interface UserRow {
  id: number;
  role: string;
}

interface MatchRequestRow {
  id: number;
  mentor_id: number;
  mentee_id: number;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MatchRequestWithFeedback extends MatchRequestRow {
  has_feedback: number;
}

// Validation schema for match request creation
const matchRequestSchema = Joi.object({
  mentorId: Joi.number().required(),
  message: Joi.string().required()
});

// Helper function to convert database row to response format
function formatMatchRequestResponse(row: MatchRequest): MatchRequestResponse {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    menteeId: row.mentee_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// POST /match-requests - Send match request (mentee only)
router.post('/match-requests',
  authenticateToken,
  requireRole('mentee'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { error, value } = matchRequestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request payload',
          details: error.details[0]?.message
        });
      }

      const { mentorId, message } = value;
      const menteeId = req.user.userId;

      // Verify mentor exists and is actually a mentor
      const mentor = await new Promise<UserRow | undefined>((resolve, reject) => {
        db.get('SELECT id, role FROM users WHERE id = ? AND role = ?',
          [mentorId, 'mentor'], 
          (err: SQLiteError | null, row: UserRow | undefined) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!mentor) {
        return res.status(400).json({ error: 'Mentor not found' });
      }

      // Check if mentee already has a pending request
      const existingRequest = await new Promise<MatchRequestRow | undefined>((resolve, reject) => {
        db.get('SELECT * FROM match_requests WHERE mentee_id = ? AND status = ?',
          [menteeId, 'pending'],
          (err: SQLiteError | null, row: MatchRequestRow | undefined) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingRequest) {
        return res.status(400).json({ 
          error: 'You already have a pending request. Please wait for a response or cancel it first.' 
        });
      }

      // Check if there's already a pending request to this mentor
      const pendingRequest = await new Promise<MatchRequestRow | undefined>((resolve, reject) => {
        db.get('SELECT * FROM match_requests WHERE mentor_id = ? AND mentee_id = ? AND status = ?',
          [mentorId, menteeId, 'pending'],
          (err: SQLiteError | null, row: MatchRequestRow | undefined) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (pendingRequest) {
        return res.status(400).json({ 
          error: 'You already have a pending request to this mentor' 
        });
      }

      // Create new match request
      const requestId = await new Promise<number>((resolve, reject) => {
        db.run(
          'INSERT INTO match_requests (mentor_id, mentee_id, message, status) VALUES (?, ?, ?, ?)',
          [mentorId, menteeId, message, 'pending'],
          function(err: SQLiteError | null) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      const newRequest: MatchRequestResponse = {
        id: requestId,
        mentorId,
        menteeId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.json(newRequest);
    } catch (error) {
      console.error('Create match request error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /match-requests/incoming - Get incoming match requests (mentor only)
router.get('/match-requests/incoming',
  authenticateToken,
  requireRole('mentor'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const requests = await new Promise<MatchRequest[]>((resolve, reject) => {
        db.all(`
          SELECT mr.*, 
                 CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as has_feedback
          FROM match_requests mr
          LEFT JOIN feedback f ON mr.id = f.match_request_id AND f.reviewer_id = ?
          WHERE mr.mentor_id = ? 
          ORDER BY mr.created_at DESC
        `,
          [req.user!.userId, req.user!.userId],
          (err: SQLiteError | null, rows: MatchRequestWithFeedback[]) => {
            if (err) reject(err);
            else {
              const formattedRows = rows.map(row => ({
                id: row.id,
                mentor_id: row.mentor_id,
                mentee_id: row.mentee_id,
                message: row.message,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
                has_feedback: Boolean(row.has_feedback)
              }));
              resolve(formattedRows as MatchRequest[]);
            }
          }
        );
      });

      const formattedRequests = requests.map(req => ({
        ...formatMatchRequestResponse(req),
        hasFeedback: (req as MatchRequestWithFeedback).has_feedback
      }));
      return res.json(formattedRequests);
    } catch (error) {
      console.error('Get incoming requests error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /match-requests/outgoing - Get outgoing match requests (mentee only)
router.get('/match-requests/outgoing',
  authenticateToken,
  requireRole('mentee'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const requests = await new Promise<MatchRequest[]>((resolve, reject) => {
        db.all(`
          SELECT mr.*, 
                 CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as has_feedback
          FROM match_requests mr
          LEFT JOIN feedback f ON mr.id = f.match_request_id AND f.reviewer_id = ?
          WHERE mr.mentee_id = ? 
          ORDER BY mr.created_at DESC
        `,
          [req.user!.userId, req.user!.userId],
          (err: SQLiteError | null, rows: MatchRequestWithFeedback[]) => {
            if (err) reject(err);
            else {
              const formattedRows = rows.map(row => ({
                id: row.id,
                mentor_id: row.mentor_id,
                mentee_id: row.mentee_id,
                message: row.message,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
                has_feedback: Boolean(row.has_feedback)
              }));
              resolve(formattedRows as MatchRequest[]);
            }
          }
        );
      });

      // For outgoing requests, don't include message in response
      const formattedRequests = requests.map(row => ({
        id: row.id,
        mentorId: row.mentor_id,
        menteeId: row.mentee_id,
        status: row.status,
        hasFeedback: (row as MatchRequestWithFeedback).has_feedback
      }));

      return res.json(formattedRequests);
    } catch (error) {
      console.error('Get outgoing requests error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /match-requests/:id/accept - Accept match request (mentor only)
router.put('/match-requests/:id/accept',
  authenticateToken,
  requireRole('mentor'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const requestId = parseInt(req.params?.id || '0');
      if (!requestId) {
        return res.status(400).json({ error: 'Invalid request ID' });
      }

      // Get the request and verify it belongs to this mentor
      const request = await new Promise<MatchRequest | undefined>((resolve, reject) => {
        db.get('SELECT * FROM match_requests WHERE id = ? AND mentor_id = ?',
          [requestId, req.user!.userId],
          (err: SQLiteError | null, row: MatchRequestRow | undefined) => {
            if (err) reject(err);
            else resolve(row as MatchRequest);
          }
        );
      });

      if (!request) {
        return res.status(404).json({ error: 'Match request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request is not in pending status' });
      }

      // Accept the request
      await new Promise<void>((resolve, reject) => {
        db.run('UPDATE match_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['accepted', requestId],
          (err: SQLiteError | null) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const updatedRequest = { ...request, status: 'accepted' as const };
      return res.json(formatMatchRequestResponse(updatedRequest));
    } catch (error) {
      console.error('Accept match request error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /match-requests/:id/reject - Reject match request (mentor only)
router.put('/match-requests/:id/reject',
  authenticateToken,
  requireRole('mentor'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const requestId = parseInt(req.params?.id || '0');
      if (!requestId) {
        return res.status(400).json({ error: 'Invalid request ID' });
      }

      // Get the request and verify it belongs to this mentor
      const request = await new Promise<MatchRequest | undefined>((resolve, reject) => {
        db.get('SELECT * FROM match_requests WHERE id = ? AND mentor_id = ?',
          [requestId, req.user!.userId],
          (err: SQLiteError | null, row: MatchRequestRow | undefined) => {
            if (err) reject(err);
            else resolve(row as MatchRequest);
          }
        );
      });

      if (!request) {
        return res.status(404).json({ error: 'Match request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request is not in pending status' });
      }

      // Reject the request
      await new Promise<void>((resolve, reject) => {
        db.run('UPDATE match_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['rejected', requestId],
          (err: SQLiteError | null) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const updatedRequest = { ...request, status: 'rejected' as const };
      return res.json(formatMatchRequestResponse(updatedRequest));
    } catch (error) {
      console.error('Reject match request error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /match-requests/:id - Cancel match request (mentee only)
router.delete('/match-requests/:id',
  authenticateToken,
  requireRole('mentee'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const requestId = parseInt(req.params?.id || '0');
      if (!requestId) {
        return res.status(400).json({ error: 'Invalid request ID' });
      }

      // Get the request and verify it belongs to this mentee
      const request = await new Promise<MatchRequest | undefined>((resolve, reject) => {
        db.get('SELECT * FROM match_requests WHERE id = ? AND mentee_id = ?',
          [requestId, req.user!.userId],
          (err: SQLiteError | null, row: MatchRequestRow | undefined) => {
            if (err) reject(err);
            else resolve(row as MatchRequest);
          }
        );
      });

      if (!request) {
        return res.status(404).json({ error: 'Match request not found' });
      }

      // Cancel the request
      await new Promise<void>((resolve, reject) => {
        db.run('UPDATE match_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['cancelled', requestId],
          (err: SQLiteError | null) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const updatedRequest = { ...request, status: 'cancelled' as const };
      return res.json(formatMatchRequestResponse(updatedRequest));
    } catch (error) {
      console.error('Cancel match request error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /match-requests/mentor/:mentorId - Get request history with a specific mentor (mentee only)
router.get('/match-requests/mentor/:mentorId',
  authenticateToken,
  requireRole('mentee'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const mentorId = parseInt(req.params.mentorId || '');
      if (isNaN(mentorId)) {
        return res.status(400).json({ error: 'Invalid mentor ID' });
      }

      const requests = await new Promise<MatchRequest[]>((resolve, reject) => {
        db.all(`
          SELECT mr.*, 
                 CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as has_feedback
          FROM match_requests mr
          LEFT JOIN feedback f ON mr.id = f.match_request_id AND f.reviewee_id = ?
          WHERE mr.mentor_id = ? AND mr.mentee_id = ?
          ORDER BY mr.created_at DESC
        `,
          [req.user!.userId, mentorId, req.user!.userId],
          (err: SQLiteError | null, rows: MatchRequestWithFeedback[]) => {
            if (err) reject(err);
            else {
              const formattedRows = rows.map(row => ({
                id: row.id,
                mentor_id: row.mentor_id,
                mentee_id: row.mentee_id,
                message: row.message,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
                has_feedback: Boolean(row.has_feedback)
              }));
              resolve(formattedRows as MatchRequest[]);
            }
          }
        );
      });

      const formattedRequests = requests.map(req => ({
        ...formatMatchRequestResponse(req),
        hasFeedback: (req as MatchRequestWithFeedback).has_feedback
      }));
      
      return res.json(formattedRequests);
    } catch (error) {
      console.error('Get mentor request history error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
