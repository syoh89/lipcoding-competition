import React, { useState, useEffect } from 'react';
import { feedbackApi } from '../services/api';
import type { Feedback } from '../types';

const FeedbackPage: React.FC = () => {
  const [receivedFeedback, setReceivedFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReceivedFeedback();
  }, []);

  const fetchReceivedFeedback = async () => {
    try {
      setLoading(true);
      const feedback = await feedbackApi.getReceived();
      setReceivedFeedback(feedback);
    } catch (err) {
      setError('피드백을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">받은 피드백</h1>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {receivedFeedback.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">받은 피드백이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedFeedback.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {feedback.reviewer.name}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {feedback.reviewer.role === 'mentor' ? '멘토' : '멘티'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-yellow-500 text-lg">
                          {renderStars(feedback.rating)}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({feedback.rating}/5)
                        </span>
                      </div>
                      
                      {feedback.comment && (
                        <p className="text-gray-700 mb-2">{feedback.comment}</p>
                      )}
                      
                      <p className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
