'use client';

import './NavBar.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function NavBar() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const reset = useStore((s) => s.reset);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await fetch('/api/user/logout', { method: 'POST' });
    reset();
    router.push('/signin');
  }

  const portfolioUsername = user?.github_username || user?.id;

  return (
    <nav className="navbar">
      <Link href="/settings/profile" className="navbar-logo">
        <img src="/Logo-small.svg" alt="DevPort" />
        <span>DevPort</span>
      </Link>

      <div className="navbar-right" ref={ref}>
        <button className="avatar-btn" onClick={() => setOpen(!open)} aria-label="Account menu">
          {user?.profile_image ? (
            <img src={user.profile_image} alt={user.name || 'Profile'} className="avatar-photo" />
          ) : (
            <img src="/profile.svg" alt="" className="avatar-icon" />
          )}
        </button>

        {open && (
          <div className="dropdown">
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="" className="avatar-photo" />
                ) : (
                  <img src="/profile.svg" alt="" className="avatar-icon" />
                )}
              </div>
              <div>
                <div className="dropdown-user-name">{user?.name || 'User'}</div>
                <div className="dropdown-user-email">{user?.email}</div>
              </div>
            </div>

            <div className="dropdown-section-label">Account</div>
            <Link href="/settings/profile" className="dropdown-item" onClick={() => setOpen(false)}>
              <img src="/profile-1.svg" alt="" />
              Profile settings
            </Link>
            <Link href="/settings/projects" className="dropdown-item" onClick={() => setOpen(false)}>
              <img src="/airplay.svg" alt="" />
              Projects settings
            </Link>
            {portfolioUsername && (
              <Link
                href={`/portfolio/${portfolioUsername}`}
                className="dropdown-item"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <img src="/multiple image-1.svg" alt="" />
                <span>
                  My Portfolio{' '}
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'inline', width: 10, height: 10, opacity: 0.5 }}>
                    <path d="M2 10L10 2M10 2H5M10 2v5" />
                  </svg>
                </span>
              </Link>
            )}
            <button className="dropdown-item danger" onClick={handleLogout}>
              <img src="/Logout.svg" alt="" />
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
