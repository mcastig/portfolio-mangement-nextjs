'use client';

import './portfolio.css';
import { useState, useEffect } from 'react';
import { use } from 'react';

interface Project {
  id: string;
  name: string;
  demo_url?: string;
  repo_url?: string;
  description?: string;
  image_url?: string;
}

interface PortfolioData {
  user: {
    id: string;
    name: string;
    job_title: string;
    bio: string;
    profile_image: string;
    email: string;
  };
  projects: Project[];
}

function ContactModal({
  username,
  onClose,
}: {
  username: string;
  onClose: () => void;
}) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/portfolio/${username}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName, senderEmail, message }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to send');
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Send a message</h2>
        {sent ? (
          <>
            <div className="message message-success">Message sent successfully!</div>
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {error && <div className="message message-error">{error}</div>}
            <div className="field">
              <label>Your name</label>
              <input className="input" type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Your email</label>
              <input className="input" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'auto' }} disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetch(`/api/portfolio/${username}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.user) setData(d);
        else if (d) setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [username]);

  if (notFound) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--color-dark)', marginBottom: '0.5rem' }}>Portfolio not found</h1>
          <p style={{ color: 'var(--color-muted)' }}>This portfolio doesn&apos;t exist or hasn&apos;t been set up yet.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--color-muted)' }}>Loading...</p>
      </div>
    );
  }

  const { user, projects } = data;

  return (
    <div className="portfolio-page">
      <div className="portfolio-hero">
        <div className="portfolio-hero-bg-default" />
      </div>

      <div className="portfolio-content">
        <div className="portfolio-avatar-wrap">
          <div className="portfolio-avatar">
            {user.profile_image ? (
              <img src={user.profile_image} alt={user.name} className="avatar-photo" />
            ) : (
              <img src="/profile.svg" alt="" className="avatar-placeholder" />
            )}
          </div>
        </div>

        <h1 className="portfolio-name">{user.name || 'Anonymous Developer'}</h1>
        {user.job_title && <p className="portfolio-title">{user.job_title}</p>}

        <button className="contact-btn" onClick={() => setShowContact(true)}>
          <img src="/message.svg" alt="" />
          Contact
        </button>

        {user.bio && (
          <div className="portfolio-section">
            <p className="portfolio-section-label">Bio</p>
            <p className="portfolio-bio">{user.bio}</p>
          </div>
        )}

        {projects.length > 0 && (
          <div className="portfolio-section">
            <p className="portfolio-section-label">Projects</p>
            {projects.map((project) => (
              <div key={project.id} className="portfolio-project-card">
                <div className="portfolio-project-image">
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.name} className="project-photo" />
                  ) : (
                    <img src="/multiple image.svg" alt="" className="project-placeholder" />
                  )}
                </div>
                <div className="portfolio-project-body">
                  <p className="portfolio-project-name">{project.name}</p>
                  {project.description && (
                    <p className="portfolio-project-desc">{project.description}</p>
                  )}
                  <div className="portfolio-project-links">
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="project-link">
                        Demo URL
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 10L10 2M10 2H5M10 2v5" />
                        </svg>
                      </a>
                    )}
                    {project.repo_url && (
                      <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="project-link">
                        Repository URL
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 10L10 2M10 2H5M10 2v5" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="portfolio-footer">
        <span>powered by</span>
        <img src="/Logo-small.svg" alt="" />
        <span>DevPort</span>
      </footer>

      {showContact && (
        <ContactModal username={username} onClose={() => setShowContact(false)} />
      )}
    </div>
  );
}
