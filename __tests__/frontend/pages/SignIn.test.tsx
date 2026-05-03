import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from '@/app/(auth)/signin/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/link', () =>
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
);

global.fetch = jest.fn();

describe('SignIn Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page heading and form elements', () => {
    render(<SignInPage />);
    expect(screen.getByText('Login to account')).toBeInTheDocument();
    expect(screen.getByText(/Enter your credentials/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the GitHub sign-in link', () => {
    render(<SignInPage />);
    expect(screen.getByText('Sign in with Github')).toBeInTheDocument();
  });

  it('renders the forgot password and create account links', () => {
    render(<SignInPage />);
    expect(screen.getByText('Forgot password')).toBeInTheDocument();
    expect(screen.getByText('Create an account')).toBeInTheDocument();
  });

  it('shows an error message on failed login', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid email or password' }),
    });

    render(<SignInPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'wrong@example.com');
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'badpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('redirects to /settings/profile on successful login', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged in', userId: 'u-1' }),
    });

    render(<SignInPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    });
  });

  it('disables the button while the request is in flight', async () => {
    let resolve: (v: unknown) => void;
    (fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<SignInPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    await act(async () => {
      resolve!({ ok: true, json: async () => ({}) });
    });
  });
});
