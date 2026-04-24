import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioPage from '@/app/portfolio/[username]/page';

global.fetch = jest.fn();

const MOCK_DATA = {
  user: {
    id: 'user-123',
    name: 'Jane Dev',
    job_title: 'Frontend Developer',
    bio: 'Hello there!',
    profile_image: null,
    email: 'jane@example.com',
  },
  projects: [
    {
      id: 'p-1',
      name: 'My App',
      demo_url: 'https://demo.com',
      repo_url: 'https://github.com/repo',
      description: 'A cool app',
      image_url: null,
    },
  ],
};

// React 19's use() checks thenable.status synchronously.
// Pre-setting status/value prevents Suspense from triggering in tests.
function resolvedParams(username: string): Promise<{ username: string }> {
  const p = Promise.resolve({ username }) as Promise<{ username: string }> & {
    status: string;
    value: { username: string };
  };
  p.status = 'fulfilled';
  p.value = { username };
  return p;
}

function renderPortfolio(username = 'janedev') {
  return render(<PortfolioPage params={resolvedParams(username)} />);
}

describe('PortfolioPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state while data is being fetched', () => {
    (fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    renderPortfolio();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows not found message when the API returns 404', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ status: 404, json: async () => null });
    renderPortfolio();
    await waitFor(() => {
      expect(screen.getByText('Portfolio not found')).toBeInTheDocument();
    });
  });

  it('renders user info on a successful fetch', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ status: 200, json: async () => MOCK_DATA });
    renderPortfolio();
    await waitFor(() => {
      expect(screen.getByText('Jane Dev')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });
  });

  it('renders project cards with demo and repo links', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ status: 200, json: async () => MOCK_DATA });
    renderPortfolio();
    await waitFor(() => {
      expect(screen.getByText('My App')).toBeInTheDocument();
      expect(screen.getByText('A cool app')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /demo url/i })).toHaveAttribute(
        'href',
        'https://demo.com'
      );
      expect(screen.getByRole('link', { name: /repository url/i })).toHaveAttribute(
        'href',
        'https://github.com/repo'
      );
    });
  });

  it('shows "Anonymous Developer" when user name is absent', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ ...MOCK_DATA, user: { ...MOCK_DATA.user, name: '' } }),
    });
    renderPortfolio();
    await waitFor(() => {
      expect(screen.getByText('Anonymous Developer')).toBeInTheDocument();
    });
  });

  it('opens the contact modal when the Contact button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ status: 200, json: async () => MOCK_DATA });
    renderPortfolio();
    await waitFor(() => screen.getByRole('button', { name: /contact/i }));
    await userEvent.click(screen.getByRole('button', { name: /contact/i }));
    expect(screen.getByText('Send a message')).toBeInTheDocument();
  });

  it('closes the contact modal when Cancel is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ status: 200, json: async () => MOCK_DATA });
    renderPortfolio();
    await waitFor(() => screen.getByRole('button', { name: /contact/i }));
    await userEvent.click(screen.getByRole('button', { name: /contact/i }));
    expect(screen.getByText('Send a message')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText('Send a message')).not.toBeInTheDocument();
    });
  });

  it('submits the contact form and shows success message', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 200, json: async () => MOCK_DATA })
      .mockResolvedValueOnce({ ok: true });

    renderPortfolio();
    await waitFor(() => screen.getByRole('button', { name: /contact/i }));
    await userEvent.click(screen.getByRole('button', { name: /contact/i }));

    const [nameInput, emailInput, messageInput] = screen.getAllByRole('textbox');
    await userEvent.type(nameInput, 'Alice');
    await userEvent.type(emailInput, 'alice@example.com');
    await userEvent.type(messageInput, 'Hello!');
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      expect(screen.getByText('Message sent successfully!')).toBeInTheDocument();
    });
  });

  it('shows an error when the contact form submission fails', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 200, json: async () => MOCK_DATA })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Failed to send' }) });

    renderPortfolio();
    await waitFor(() => screen.getByRole('button', { name: /contact/i }));
    await userEvent.click(screen.getByRole('button', { name: /contact/i }));

    const [nameInput, emailInput, messageInput] = screen.getAllByRole('textbox');
    await userEvent.type(nameInput, 'Bob');
    await userEvent.type(emailInput, 'bob@example.com');
    await userEvent.type(messageInput, 'Hi!');
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to send')).toBeInTheDocument();
    });
  });
});
