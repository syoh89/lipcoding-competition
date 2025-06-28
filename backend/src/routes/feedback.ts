import express, { Response } from 'express';
import Joi from 'joi';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../database/init';
import type { FeedbackCreate, JWTPayload } from '../types';

const router = express.Router();

// SQLite types
interface SQLiteError extends Error {
  errno?: number;
  code?: string;
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

interface FeedbackRow {
  id: number;
  match_request_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

interface FeedbackWithReviewer extends FeedbackRow {
  reviewer_name: string;
  reviewer_role: string;
}

interface InsertResult {
  id: number;
}

interface SQLiteRunContext {
  lastID: number;
}

// Validation schemas
const createFeedbackSchema = Joi.object({
  matchRequestId: Joi.number().integer().positive().required(),
  revieweeId: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional().allow('')
});

// Create feedback
router.post('/feedback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = createFeedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0]?.message || 'Validation error' });
    }

    const { matchRequestId, revieweeId, rating, comment } = value as FeedbackCreate;
    const user = req.user as JWTPayload;

    // Check if match request exists and is accepted
    const matchRequest = await new Promise<MatchRequestRow | undefined>((resolve, reject) => {
      db.get(
        `SELECT * FROM match_requests WHERE id = ? AND status = 'accepted'`,
        [matchRequestId],
        (err: SQLiteError | null, row: MatchRequestRow | undefined) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!matchRequest) {
      return res.status(404).json({ error: 'Match request not found or not accepted' });
    }

    // Check if user is part of this match
    if (user.userId !== matchRequest.mentor_id && user.userId !== matchRequest.mentee_id) {
      return res.status(403).json({ error: 'Not authorized to give feedback for this match' });
    }

    // Check if reviewee is the other party in the match
    const expectedRevieweeId = user.userId === matchRequest.mentor_id
      ? matchRequest.mentee_id
      : matchRequest.mentor_id;

    if (revieweeId !== expectedRevieweeId) {
      return res.status(400).json({ error: 'Invalid reviewee for this match' });
    }

    // Check if feedback already exists
    const existingFeedback = await new Promise<Pick<FeedbackRow, 'id'> | undefined>((resolve, reject) => {
      db.get(
        `SELECT id FROM feedback WHERE match_request_id = ? AND reviewer_id = ?`,
        [matchRequestId, user.userId],
        (err: SQLiteError | null, row: Pick<FeedbackRow, 'id'> | undefined) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingFeedback) {
      return res.status(400).json({ error: 'Feedback already submitted for this match' });
    }    // Create feedback
    const result = await new Promise<InsertResult>((resolve, reject) => {
      db.run(
        `INSERT INTO feedback (match_request_id, reviewer_id, reviewee_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [matchRequestId, user.userId, revieweeId, rating, comment || null],
        function (this: SQLiteRunContext, err: SQLiteError | null) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    return res.status(201).json({
      id: result.id,
      matchRequestId,
      reviewerId: user.userId,
      revieweeId,
      rating,
      comment: comment || null
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feedback received by a user
router.get('/feedback/received', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user as JWTPayload;

    const feedback = await new Promise<FeedbackWithReviewer[]>((resolve, reject) => {
      db.all(
        `SELECT
          f.*,
          reviewer.name as reviewer_name,
          reviewer.role as reviewer_role
        FROM feedback f
        JOIN users reviewer ON f.reviewer_id = reviewer.id
        WHERE f.reviewee_id = ?
        ORDER BY f.created_at DESC`,
        [user.userId],
        (err: SQLiteError | null, rows: FeedbackWithReviewer[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const feedbackList = feedback.map((row: FeedbackWithReviewer) => ({
      id: row.id,
      matchRequestId: row.match_request_id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      reviewer: {
        name: row.reviewer_name,
        role: row.reviewer_role
      }
    }));

    return res.json(feedbackList);
  } catch (error) {
    console.error('Error fetching received feedback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
