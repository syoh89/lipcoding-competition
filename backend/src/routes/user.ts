import { Router, Response } from 'express';
import Joi from 'joi';
import multer from 'multer';
import { db } from '../database/init';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { User, UpdateProfileRequest, UserProfile } from '../types';

// SQLite types
interface SQLiteError extends Error {
  errno?: number;
  code?: string;
}

interface ImageRow {
  image_data: Buffer;
  image_type: string;
}

const router = Router();

// Multer configuration for file uploads
const upload = multer({
  limits: {
    fileSize: 1024 * 1024 // 1MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg and .png files are allowed'));
    }
  }
});

// Validation schema for profile update
const updateProfileSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  role: Joi.string().valid('mentor', 'mentee').required(),
  bio: Joi.string().required(),
  image: Joi.string().optional(),
  skills: Joi.array().items(Joi.string()).optional()
});

// Helper function to get user profile
async function getUserProfile(userId: number): Promise<UserProfile | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err: SQLiteError | null, row: User | undefined) => {
      if (err) {
        reject(err);
        return;
      }

      if (!row) {
        resolve(null);
        return;
      }

      const user = row as User;
      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: {
          name: user.name,
          bio: user.bio || '',
          imageUrl: user.image_data ? `/images/${user.role}/${user.id}` : 
            `https://placehold.co/500x500.jpg?text=${user.role.toUpperCase()}`,
          skills: user.role === 'mentor' && user.skills ? 
            (() => {
              try {
                return JSON.parse(user.skills);
              } catch {
                // If not valid JSON, split by comma as fallback
                return user.skills.split(',').map(s => s.trim());
              }
            })() : undefined
        }
      };

      resolve(profile);
    });
  });
}

// GET /me - Get current user information
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const profile = await getUserProfile(req.user.userId);
    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /images/:role/:id - Get profile image
router.get('/images/:role/:id', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { role, id } = req.params;

  if (!role || !['mentor', 'mentee'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  db.get('SELECT image_data, image_type FROM users WHERE id = ? AND role = ?', 
    [id, role], 
    (err: SQLiteError | null, row: ImageRow | undefined) => {
      if (err) {
        console.error('Get image error:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      if (!row || !row.image_data) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      res.set('Content-Type', row.image_type);
      res.send(row.image_data);
    }
  );
});

// PUT /profile - Update user profile
router.put('/profile', authenticateToken, upload.none(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Invalid request payload', details: error.details[0]?.message });
    }

    const profileData: UpdateProfileRequest = value;

    // Verify user can only update their own profile
    if (profileData.id !== req.user.userId) {
      return res.status(403).json({ error: 'Cannot update another user\'s profile' });
    }

    // Verify role matches
    if (profileData.role !== req.user.role) {
      return res.status(400).json({ error: 'Cannot change user role' });
    }

    let imageData: Buffer | undefined;
    let imageType: string | undefined;

    // Handle base64 image if provided
    if (profileData.image) {
      try {
        const matches = profileData.image.match(/^data:image\/(jpeg|png);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({ error: 'Invalid image format. Must be base64 encoded JPEG or PNG' });
        }

        const [, type, base64Data] = matches;
        if (base64Data) {
          imageData = Buffer.from(base64Data, 'base64');
          imageType = `image/${type}`;

          // Validate image size (should be done more thoroughly in production)
          if (imageData.length > 1024 * 1024) {
            return res.status(400).json({ error: 'Image too large. Maximum size is 1MB' });
          }
        }
      } catch (imageError) {
        return res.status(400).json({ error: 'Invalid image data' });
      }
    }

    // Prepare skills data for mentors
    const skillsJson = profileData.role === 'mentor' && profileData.skills ? 
      JSON.stringify(profileData.skills) : null;

    // Update user profile
    await new Promise<void>((resolve, reject) => {
      const updateQuery = imageData ? 
        'UPDATE users SET name = ?, bio = ?, skills = ?, image_data = ?, image_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?' :
        'UPDATE users SET name = ?, bio = ?, skills = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      const params = imageData ? 
        [profileData.name, profileData.bio, skillsJson, imageData, imageType, profileData.id] :
        [profileData.name, profileData.bio, skillsJson, profileData.id];

      db.run(updateQuery, params, function(err: SQLiteError | null) {
        if (err) reject(err);
        else resolve();
      });
    });

    // Return updated profile
    const updatedProfile = await getUserProfile(profileData.id);
    return res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
