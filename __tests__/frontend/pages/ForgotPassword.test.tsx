import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';

jest.mock('next/link', () =>
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
);

global.fetch = jest.fn();

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page heading and form elements', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Forgot password')).toBeInTheDocument();
    expect(screen.getByText(/email you instructions/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('renders the back to login link', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });

  it('shows an error message on failed request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to send reset email' }),
    });

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
    });
  });

  it('shows success message after sending reset email', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'If an account exists...' }),
    });

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/Check your inbox/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
    });
  });

  it('disables the button while the request is in flight', async () => {
    let resolve: (v: unknown) => void;
    (fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    resolve!({ ok: true, json: async () => ({}) });
  });
});
