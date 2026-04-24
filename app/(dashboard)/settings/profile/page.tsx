'use client';

import '../settings.css';
import './profile.css';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

export default function ProfileSettingsPage() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setJobTitle(user.job_title || '');
      setBio(user.bio || '');
      setProfileImage(user.profile_image || '');
    }
  }, [user]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, job_title: jobTitle, bio, profile_image: profileImage }),
      });
      if (!res.ok) {
        const d = await res.json();
        setMessage({ type: 'error', text: d.error || 'Save failed' });
        return;
      }
      if (user) {
        setUser({ ...user, name, job_title: jobTitle, bio, profile_image: profileImage });
      }
      setMessage({ type: 'success', text: 'Profile saved successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Profile settings</h1>

      <div className="settings-card">
        <form onSubmit={handleSave}>
          <div className="image-upload-zone">
            <div className="upload-preview">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="preview-photo" />
              ) : (
                <img src="/profile.svg" alt="" className="preview-icon" />
              )}
            </div>
            <p className="image-upload-hint">Image must be 256 × 256px - max 2MB</p>
            <div className="upload-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileRef.current?.click()}
              >
                <img src="/upload.svg" alt="" width={16} height={16} />
                Upload Profile Image
              </button>
              {profileImage && (
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={() => {
                    setProfileImage('');
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                >
                  <img src="/Trash.svg" alt="" width={16} height={16} />
                  Delete Image
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          {message && (
            <div className={`message message-${message.type}`} style={{ marginBottom: '1rem' }}>
              {message.text}
            </div>
          )}

          <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={user?.email || ''}
                disabled
                placeholder="example@mail.com"
              />
            </div>
            <div className="field">
              <label>Job title</label>
              <input
                className="input"
                type="text"
                placeholder="Enter your job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: '1rem' }}>
            <label>Name</label>
            <input
              className="input"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: '1rem' }}>
            <label>Bio</label>
            <textarea
              className="input"
              placeholder="Enter a short introduction.."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', minWidth: 120 }} disabled={saving}>
              <img src="/check circle.svg" alt="" width={16} height={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
