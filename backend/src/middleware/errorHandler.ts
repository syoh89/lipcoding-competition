import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  const response: ErrorResponse = {
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  };

  res.status(500).json(response);
}
