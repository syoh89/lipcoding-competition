<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Mento-Menti Project Guidelines

This is a mentor-mentee matching application built with TypeScript, React, and Node.js.

## Project Structure
- `/frontend`: React + TypeScript + Vite frontend application
- `/backend`: Node.js + Express + TypeScript backend API
- `/openapi.yaml`: OpenAPI 3.0 specification for the API

## Technology Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Context API for state management

### Backend
- Node.js with TypeScript
- Express.js framework
- SQLite database
- JWT authentication
- Swagger UI for API documentation
- Multer for file uploads

## Code Style Guidelines

1. Use TypeScript strict mode
2. Follow functional component patterns with hooks
3. Use proper error handling with try-catch blocks
4. Implement proper form validation
5. Use semantic HTML and accessible components
6. Follow REST API conventions
7. Use proper HTTP status codes
8. Implement proper authentication middleware

## Security Considerations

- JWT tokens with 1-hour expiration
- Input validation using Joi
- SQL injection prevention
- XSS protection
- File upload validation
- Rate limiting
- CORS configuration

## Database Schema

- Users table: id, email, password, name, role, bio, image_data, image_type, skills
- Match_requests table: id, mentor_id, mentee_id, message, status

## API Endpoints

All endpoints follow the OpenAPI specification in `/openapi.yaml`:
- Authentication: `/signup`, `/login`
- User management: `/me`, `/profile`, `/images/:role/:id`
- Mentors: `/mentors` (with filtering and sorting)
- Match requests: `/match-requests/*` (CRUD operations)

## Features

1. User registration and login with role selection (mentor/mentee)
2. Profile management with image upload
3. Mentor discovery with filtering by skills
4. Match request system with status tracking
5. Role-based access control
6. Real-time status updates

## Development Guidelines

- Use proper TypeScript types for all data structures
- Implement proper error boundaries in React
- Use loading states for async operations
- Provide user feedback for all actions
- Follow accessibility best practices
- Write meaningful commit messages
- Use environment variables for configuration
