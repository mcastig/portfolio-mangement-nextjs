import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpPage from '@/app/(auth)/signup/page';

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

describe('SignUp Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page heading and form elements', () => {
    render(<SignUpPage />);
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText(/Enter the fields below/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders the GitHub sign-in link', () => {
    render(<SignUpPage />);
    expect(screen.getByText('Sign in with Github')).toBeInTheDocument();
  });

  it('renders the log in link', () => {
    render(<SignUpPage />);
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('renders password requirements', () => {
    render(<SignUpPage />);
    expect(screen.getByText('one lower case character')).toBeInTheDocument();
    expect(screen.getByText('one uppercase character')).toBeInTheDocument();
    expect(screen.getByText('one special character')).toBeInTheDocument();
    expect(screen.getByText('one number')).toBeInTheDocument();
    expect(screen.getByText('8 character minimum')).toBeInTheDocument();
  });

  it('shows an error message on failed sign-up', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    });

    render(<SignUpPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'taken@example.com');
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('redirects to /settings/profile on successful sign-up', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Created', userId: 'u-1' }),
    });

    render(<SignUpPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'new@example.com');
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    });
  });

  it('disables the button while the request is in flight', async () => {
    let resolve: (v: unknown) => void;
    (fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<SignUpPage />);
    await userEvent.type(screen.getByPlaceholderText('Enter email'), 'new@example.com');
    await userEvent.type(screen.getByPlaceholderText('Enter a password'), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    resolve!({ ok: true, json: async () => ({}) });
  });
});
