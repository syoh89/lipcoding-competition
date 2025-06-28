import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { SignupRequest } from '../types';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    password: '',
    name: '',
    role: 'mentee',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // API에 맞는 형식으로 데이터 준비
      const signupData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
      };
      
      await signup(signupData);
      navigate('/login', { 
        state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              로그인
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">이메일 주소</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="form-input"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="name" className="form-label">이름</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="form-input"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="role" className="form-label">역할</label>
              <select
                id="role"
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="mentee">멘티</option>
                <option value="mentor">멘토</option>
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </div>
          <div className="text-center">
            <span className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link className="font-medium text-primary-600 hover:text-primary-500" to="/login">
                로그인
              </Link>
            </span>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center mt-2">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
