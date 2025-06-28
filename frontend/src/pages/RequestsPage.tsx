import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchRequestApi, feedbackApi } from '../services/api';
import type { MatchRequest, MatchRequestOutgoing } from '../types';

const RequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MatchRequestOutgoing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    matchRequestId: number;
    revieweeId: number;
    revieweeName: string;
  }>({
    isOpen: false,
    matchRequestId: 0,
    revieweeId: 0,
    revieweeName: ''
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      if (user.role === 'mentor') {
        const incoming = await matchRequestApi.getIncoming();
        setIncomingRequests(incoming);
      } else {
        const outgoing = await matchRequestApi.getOutgoing();
        setOutgoingRequests(outgoing);
      }
    } catch (err) {
      setError('요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await matchRequestApi.accept(id);
      await fetchRequests();
      alert('요청을 수락했습니다!');
    } catch (err: any) {
      alert(err.response?.data?.error || '요청 수락에 실패했습니다.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await matchRequestApi.reject(id);
      await fetchRequests();
      alert('요청을 거절했습니다.');
    } catch (err: any) {
      alert(err.response?.data?.error || '요청 거절에 실패했습니다.');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('정말로 요청을 취소하시겠습니까?')) return;

    try {
      await matchRequestApi.cancel(id);
      await fetchRequests();
      alert('요청을 취소했습니다.');
    } catch (err: any) {
      alert(err.response?.data?.error || '요청 취소에 실패했습니다.');
    }
  };

  const openFeedbackModal = (matchRequestId: number, revieweeId: number, revieweeName: string) => {
    setFeedbackModal({
      isOpen: true,
      matchRequestId,
      revieweeId,
      revieweeName
    });
    setFeedbackForm({ rating: 5, comment: '' });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      matchRequestId: 0,
      revieweeId: 0,
      revieweeName: ''
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!user) return;

    try {
      await feedbackApi.create({
        matchRequestId: feedbackModal.matchRequestId,
        revieweeId: feedbackModal.revieweeId,
        rating: feedbackForm.rating,
        comment: feedbackForm.comment
      });
      closeFeedbackModal();
      alert('피드백이 전송되었습니다!');
      // 피드백 제출 후 요청 목록 새로고침
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || '피드백 전송에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: '대기중', class: 'bg-yellow-100 text-yellow-800' },
      accepted: { text: '수락됨', class: 'bg-green-100 text-green-800' },
      rejected: { text: '거절됨', class: 'bg-red-100 text-red-800' },
      cancelled: { text: '취소됨', class: 'bg-gray-100 text-gray-800' }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {user.role === 'mentor' ? '받은 매칭 요청' : '보낸 매칭 요청'}
          </h1>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : user.role === 'mentor' ? (
            // 멘토용: 받은 요청 목록
            incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">받은 매칭 요청이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium">멘티 ID: {request.menteeId}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-gray-600 mb-4">{request.message}</p>
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="btn-primary"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="btn-secondary"
                        >
                          거절
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'accepted' && !request.hasFeedback && (
                      <button
                        onClick={() => openFeedbackModal(
                          request.id, 
                          request.menteeId, 
                          `멘티`
                        )}
                        className="btn-primary bg-green-600 hover:bg-green-700"
                      >
                        피드백 주기
                      </button>
                    )}
                    
                    {request.status === 'accepted' && request.hasFeedback && (
                      <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                        피드백 완료
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // 멘티용: 보낸 요청 목록
            outgoingRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">보낸 매칭 요청이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium">멘토 ID: {request.mentorId}</h3>
                        <div className="mt-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="btn-secondary"
                        >
                          취소
                        </button>
                      )}
                      
                      {request.status === 'accepted' && !request.hasFeedback && (
                        <button
                          onClick={() => openFeedbackModal(
                            request.id, 
                            request.mentorId, 
                            `멘토`
                          )}
                          className="btn-primary bg-green-600 hover:bg-green-700"
                        >
                          피드백 주기
                        </button>
                      )}
                      
                      {request.status === 'accepted' && request.hasFeedback && (
                        <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
                          피드백 완료
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* 피드백 모달 */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {feedbackModal.revieweeName}에게 피드백 주기
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  평점
                </label>
                <select
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="form-input"
                >
                  <option value={5}>5 - 매우 좋음</option>
                  <option value={4}>4 - 좋음</option>
                  <option value={3}>3 - 보통</option>
                  <option value={2}>2 - 나쁨</option>
                  <option value={1}>1 - 매우 나쁨</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  코멘트 (선택사항)
                </label>
                <textarea
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="form-input"
                  placeholder="피드백을 입력하세요..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleFeedbackSubmit}
                  className="btn-primary flex-1"
                >
                  피드백 전송
                </button>
                <button
                  onClick={closeFeedbackModal}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
