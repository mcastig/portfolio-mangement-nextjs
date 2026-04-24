import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';

const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
}));

jest.mock('next/link', () =>
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
);

global.fetch = jest.fn();

describe('ResetPassword Page', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows invalid link message when no token is in the URL', () => {
    mockSearchParamsGet.mockReturnValue(null);
    render(<ResetPasswordPage />);
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request new link/i })).toBeInTheDocument();
  });

  it('renders the password form when a token is present', () => {
    mockSearchParamsGet.mockReturnValue('valid-token');
    render(<ResetPasswordPage />);
    expect(screen.getByPlaceholderText('Enter a password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Re-enter a password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows the password requirements checklist', () => {
    mockSearchParamsGet.mockReturnValue('valid-token');
    render(<ResetPasswordPage />);
    expect(screen.getByText('one lower case character')).toBeInTheDocument();
    expect(screen.getByText('one uppercase character')).toBeInTheDocument();
    expect(screen.getByText('8 character minimum')).toBeInTheDocument();
    expect(screen.getByText('one number')).toBeInTheDocument();
    expect(screen.getByText('one special character')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    mockSearchParamsGet.mockReturnValue('valid-token');
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.type(screen.getByPlaceholderText('Re-enter a password'), 'Different2@');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows error message from the API on failure', async () => {
    mockSearchParamsGet.mockReturnValue('valid-token');
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Reset link has expired' }),
    });
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.type(screen.getByPlaceholderText('Re-enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(screen.getByText('Reset link has expired')).toBeInTheDocument();
    });
  });

  it('redirects to /settings/profile on success', async () => {
    mockSearchParamsGet.mockReturnValue('valid-token');
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password reset successfully' }),
    });
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.type(screen.getByPlaceholderText('Re-enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    });
  });

  it('disables the submit button while the request is in flight', async () => {
    mockSearchParamsGet.mockReturnValue('valid-token');
    let resolve: (v: unknown) => void;
    (fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.type(screen.getByPlaceholderText('Re-enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
    resolve!({ ok: true, json: async () => ({}) });
  });
});
