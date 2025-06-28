import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            안녕하세요, {user.profile.name}님!
          </h1>
          <p className="text-gray-600 mb-6">
            {user.role === 'mentor' 
              ? '멘티들의 요청을 확인하고 멘토링을 시작하세요.' 
              : '멘토를 찾아 멘토링을 요청해보세요.'}
          </p>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-primary-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        프로필 상태
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user.profile.bio ? '완료' : '미완성'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {user.role === 'mentor' && (
              <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">S</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          스킬
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {user.profile.skills?.length || 0}개
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">R</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        요청 관리
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        확인 필요
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 액션</h2>
          <div className="flex flex-wrap gap-4">
            {user.role === 'mentee' && (
              <a
                href="/mentors"
                className="btn-primary"
              >
                멘토 찾기
              </a>
            )}
            <a
              href="/requests"
              className="btn-secondary"
            >
              요청 관리
            </a>
            <a
              href="/profile"
              className="btn-secondary"
            >
              프로필 수정
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
