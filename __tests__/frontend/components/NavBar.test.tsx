import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBar from '@/components/NavBar/NavBar';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/link', () =>
  function MockLink({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...rest}>{children}</a>;
  }
);

jest.mock('@/components/NavBar/NavBar.css', () => ({}), { virtual: true });

const mockUseStore = jest.fn();
jest.mock('@/store/useStore', () => ({
  useStore: (selector: (s: unknown) => unknown) => mockUseStore(selector),
}));

global.fetch = jest.fn();

const MOCK_USER = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  job_title: 'Developer',
  bio: 'Hello',
  profile_image: null,
  github_username: 'testuser',
};

const mockReset = jest.fn();

function setupStore(user: typeof MOCK_USER | null = MOCK_USER) {
  mockUseStore.mockImplementation((selector: (s: { user: typeof MOCK_USER | null; reset: () => void }) => unknown) => {
    const state = { user, reset: mockReset };
    return selector(state);
  });
}

describe('NavBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
  });

  it('renders the logo link', () => {
    render(<NavBar />);
    expect(screen.getByText('DevPort')).toBeInTheDocument();
  });

  it('renders the avatar button', () => {
    render(<NavBar />);
    expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
  });

  it('opens the dropdown when the avatar is clicked', async () => {
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('Profile settings')).toBeInTheDocument();
    expect(screen.getByText('Projects settings')).toBeInTheDocument();
    expect(screen.getByText(/My Portfolio/i)).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('shows user name and email in the dropdown', async () => {
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows "User" when name is not set', async () => {
    setupStore({ ...MOCK_USER, name: undefined as unknown as string });
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('links My Portfolio to the github username', async () => {
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    const portfolioLink = screen.getByRole('link', { name: /My Portfolio/i });
    expect(portfolioLink).toHaveAttribute('href', '/portfolio/testuser');
  });

  it('falls back to user id for portfolio link when no github username', async () => {
    setupStore({ ...MOCK_USER, github_username: undefined as unknown as string });
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    const portfolioLink = screen.getByRole('link', { name: /My Portfolio/i });
    expect(portfolioLink).toHaveAttribute('href', '/portfolio/user-123');
  });

  it('calls logout API and redirects on log out', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    await userEvent.click(screen.getByText('Log out'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/logout', { method: 'POST' });
      expect(mockReset).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/signin');
    });
  });

  it('closes dropdown when clicking outside', async () => {
    render(<NavBar />);
    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByText('Profile settings')).toBeInTheDocument();

    await userEvent.click(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Profile settings')).not.toBeInTheDocument();
    });
  });
});
