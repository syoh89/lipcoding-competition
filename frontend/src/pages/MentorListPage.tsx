import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mentorApi, matchRequestApi } from '../services/api';
import type { User, MentorFilters, MatchRequest } from '../types';

const MentorListPage: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<MentorFilters>({});
  const [searchSkill, setSearchSkill] = useState('');
  const [requestHistories, setRequestHistories] = useState<Record<number, MatchRequest[]>>({});
  const [showingHistory, setShowingHistory] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'mentee') return;
    fetchMentors();
  }, [user, filters]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const data = await mentorApi.getMentors(filters);
      setMentors(data);
    } catch (err) {
      setError('멘토 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      skill: searchSkill || undefined
    }));
  };

  const handleSortChange = (orderBy: 'skill' | 'name') => {
    setFilters(prev => ({
      ...prev,
      orderBy
    }));
  };

  const getRequestHistory = async (mentorId: number) => {
    if (requestHistories[mentorId]) {
      setShowingHistory(showingHistory === mentorId ? null : mentorId);
      return;
    }

    try {
      const history = await matchRequestApi.getHistoryWithMentor(mentorId);
      setRequestHistories(prev => ({
        ...prev,
        [mentorId]: history
      }));
      setShowingHistory(mentorId);
    } catch (err) {
      console.error('Failed to fetch request history:', err);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const canSendNewRequest = (mentorId: number): boolean => {
    const history = requestHistories[mentorId];
    if (!history || history.length === 0) return true;
    
    // Check if there's any pending request
    return !history.some(req => req.status === 'pending');
  };

  const sendMatchRequest = async (mentorId: number) => {
    if (!user) return;

    const message = prompt('멘토에게 보낼 메시지를 입력하세요:');
    if (!message) return;

    try {
      await matchRequestApi.create({
        mentorId,
        message
      });
      alert('매칭 요청이 전송되었습니다!');
      
      // Clear cached request history for this mentor to force refresh
      setRequestHistories(prev => {
        const updated = { ...prev };
        delete updated[mentorId];
        return updated;
      });
      
      // If currently showing history, refresh it
      if (showingHistory === mentorId) {
        setShowingHistory(null);
        setTimeout(() => getRequestHistory(mentorId), 100);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '요청 전송에 실패했습니다.');
    }
  };

  if (user?.role !== 'mentee') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">멘티만 멘토 목록을 볼 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">멘토 찾기</h1>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="기술 스택으로 검색 (예: React)"
                className="form-input"
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={handleSearch} className="btn-primary">
              검색
            </button>
            <select
              className="form-input w-auto"
              onChange={(e) => handleSortChange(e.target.value as 'skill' | 'name')}
              value={filters.orderBy || ''}
            >
              <option value="">정렬 기준</option>
              <option value="name">이름순</option>
              <option value="skill">기술스택순</option>
            </select>
          </div>

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
          ) : mentors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">등록된 멘토가 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <img
                      src={mentor.profile.imageUrl}
                      alt={mentor.profile.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {mentor.profile.name}
                      </h3>
                      <p className="text-sm text-gray-500">멘토</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{mentor.profile.bio}</p>
                  
                  {mentor.profile.skills && mentor.profile.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">기술 스택:</p>
                      <div className="flex flex-wrap gap-1">
                        {mentor.profile.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request History Section */}
                  <div className="mb-4">
                    <button
                      onClick={() => getRequestHistory(mentor.id)}
                      className="text-sm text-primary-600 hover:text-primary-800 mb-2"
                    >
                      요청 기록 보기 {showingHistory === mentor.id ? '▼' : '▶'}
                    </button>
                    
                    {showingHistory === mentor.id && requestHistories[mentor.id] && (
                      <div className="mt-2 p-3 bg-white rounded border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">이전 요청 기록</h4>
                        {requestHistories[mentor.id].length === 0 ? (
                          <p className="text-sm text-gray-500">요청 기록이 없습니다.</p>
                        ) : (
                          <div className="space-y-2">
                            {requestHistories[mentor.id].map((req) => (
                              <div key={req.id} className="text-sm border-l-2 border-gray-200 pl-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(req.status)}`}>
                                    {getStatusText(req.status)}
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(req.createdAt || '').toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-600 mt-1">{req.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Request Button */}
                  <div className="space-y-2">
                    {canSendNewRequest(mentor.id) ? (
                      <button
                        onClick={() => sendMatchRequest(mentor.id)}
                        className="w-full btn-primary"
                      >
                        매칭 요청하기
                      </button>
                    ) : (
                      <div>
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed mb-2"
                        >
                          대기 중인 요청이 있습니다
                        </button>
                        <button
                          onClick={() => getRequestHistory(mentor.id)}
                          className="w-full text-sm text-primary-600 hover:text-primary-800"
                        >
                          요청 상태 확인하기
                        </button>
                      </div>
                    )}
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

export default MentorListPage;
