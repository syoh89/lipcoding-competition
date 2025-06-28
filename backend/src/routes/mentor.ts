import { Router, Response } from 'express';
import { db } from '../database/init';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { User, MentorListItem } from '../types';

const router = Router();

// SQLite types
interface SQLiteError extends Error {
  errno?: number;
  code?: string;
}

// Helper function to get mentors list
async function getMentorsList(skillFilter?: string, orderBy?: string): Promise<MentorListItem[]> {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM users WHERE role = ?';
    const params: (string | number)[] = ['mentor'];

    // Add skill filter if provided
    if (skillFilter) {
      // Search for skill in both JSON array format and comma-separated format
      // Case-insensitive search
      query += ' AND (LOWER(skills) LIKE LOWER(?) OR LOWER(skills) LIKE LOWER(?) OR LOWER(skills) LIKE LOWER(?) OR LOWER(skills) = LOWER(?))';
      params.push(
        `%"${skillFilter}"%`,    // JSON array format: ["React", "JavaScript"]
        `%${skillFilter},%`,     // Comma-separated, skill at beginning or middle
        `%, ${skillFilter}%`,    // Comma-separated with space after comma
        skillFilter              // Exact match for single skill
      );
    }

    // Add ordering
    if (orderBy === 'skill') {
      query += ' ORDER BY skills ASC';
    } else if (orderBy === 'name') {
      query += ' ORDER BY name ASC';
    } else {
      query += ' ORDER BY id ASC';
    }

    db.all(query, params, (err: SQLiteError | null, rows: User[]) => {
      if (err) {
        reject(err);
        return;
      }

      const mentors: MentorListItem[] = rows.map((user: User) => ({
        id: user.id,
        email: user.email,
        role: 'mentor' as const,
        profile: {
          name: user.name,
          bio: user.bio || '',
          imageUrl: user.image_data ? `/images/mentor/${user.id}` : 
            'https://placehold.co/500x500.jpg?text=MENTOR',
          skills: user.skills ? 
            (() => {
              try {
                return JSON.parse(user.skills);
              } catch {
                // If not valid JSON, split by comma as fallback
                return user.skills.split(',').map(s => s.trim());
              }
            })() : []
        }
      }));

      resolve(mentors);
    });
  });
}

// GET /mentors - Get list of mentors (mentee only)
router.get('/mentors', 
  authenticateToken, 
  requireRole('mentee'), 
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { skill, orderBy } = req.query as { skill?: string; orderBy?: string };

      // Validate orderBy parameter
      if (orderBy && !['skill', 'name'].includes(orderBy)) {
        res.status(400).json({ 
          error: 'Invalid orderBy parameter. Must be "skill" or "name"' 
        });
        return;
      }

      const mentors = await getMentorsList(skill, orderBy);
      res.json(mentors);
    } catch (error) {
      console.error('Get mentors error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
