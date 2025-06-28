export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
  bio?: string;
  image_data?: Buffer;
  image_type?: string;
  skills?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  role: 'mentor' | 'mentee';
  profile: {
    name: string;
    bio: string;
    imageUrl: string;
    skills?: string[];
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: 'mentor' | 'mentee';
  bio?: string;
  skills?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface UpdateProfileRequest {
  id: number;
  name: string;
  role: 'mentor' | 'mentee';
  bio: string;
  image?: string; // Base64 encoded
  skills?: string[];
}

export interface MatchRequest {
  id: number;
  mentor_id: number;
  mentee_id: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MatchRequestCreate {
  mentorId: number;
  message: string;
}

export interface MatchRequestResponse {
  id: number;
  mentorId: number;
  menteeId: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  hasFeedback?: boolean;
}

export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  name: string;
  email: string;
  role: 'mentor' | 'mentee';
  userId: number;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface MentorListItem {
  id: number;
  email: string;
  role: 'mentor';
  profile: {
    name: string;
    bio: string;
    imageUrl: string;
    skills: string[];
  };
}

export interface Feedback {
  id: number;
  match_request_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface FeedbackCreate {
  matchRequestId: number;
  revieweeId: number;
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  id: number;
  matchRequestId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    name: string;
    role: 'mentor' | 'mentee';
  };
  reviewee: {
    name: string;
    role: 'mentor' | 'mentee';
  };
}
