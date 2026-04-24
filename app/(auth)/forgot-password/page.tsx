'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <img src="/Logo-small.svg" alt="DevPort" />
        <span>DevPort</span>
      </div>

      <div className="auth-heading">
        <h1>Forgot password</h1>
        <p>We&apos;ll email you instructions to reset your password</p>
      </div>

      {success ? (
        <div className="auth-form">
          <div className="message message-success">
            Check your inbox — we sent a reset link to {email}.
          </div>
          <Link href="/signin" className="auth-link-row">
            Back to login
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="message message-error">{error}</div>}

          <input
            className="input"
            type="email"
            placeholder="Enter a password"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Reset Password'}
          </button>

          <Link href="/signin" className="auth-link-row">
            Back to login
          </Link>
        </form>
      )}
    </div>
  );
}
