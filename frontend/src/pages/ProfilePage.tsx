import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UpdateProfileRequest } from '../types';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.profile.name || '',
    bio: user?.profile.bio || '',
    skills: user?.profile.skills?.join(', ') || '',
    image: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          image: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData: UpdateProfileRequest = {
        id: user.id,
        name: formData.name,
        role: user.role,
        bio: formData.bio,
        image: formData.image || undefined,
        skills: user.role === 'mentor' ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : undefined
      };

      await updateProfile(updateData);
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
    } catch (err: any) {
      setError(err.response?.data?.error || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">프로필 수정</h1>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="form-label">
                이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="bio" className="form-label">
                소개글
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                className="form-input"
                placeholder="자신을 소개해주세요"
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            {user.role === 'mentor' && (
              <div>
                <label htmlFor="skills" className="form-label">
                  기술 스택 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  className="form-input"
                  placeholder="React, TypeScript, Node.js"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>
            )}

            <div>
              <label htmlFor="image" className="form-label">
                프로필 이미지
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/jpeg,image/png"
                className="form-input"
                onChange={handleImageChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                JPG 또는 PNG 파일, 최대 1MB, 500x500~1000x1000 픽셀
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '저장 중...' : '프로필 저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
