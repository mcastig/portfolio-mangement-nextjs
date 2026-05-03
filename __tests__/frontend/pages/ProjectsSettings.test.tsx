import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsSettingsPage from '@/app/(dashboard)/settings/projects/page';
import { useStore } from '@/store/useStore';

global.fetch = jest.fn();

const MOCK_PROJECTS = [
  {
    id: 'p-1',
    name: 'My App',
    description: 'A cool app',
    demo_url: '',
    repo_url: '',
    image_url: '',
  },
  {
    id: 'p-2',
    name: 'Another Project',
    description: '',
    demo_url: '',
    repo_url: '',
    image_url: '',
  },
];

describe('ProjectsSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStore.setState({ user: null, projects: [], isLoading: false });
  });

  it('shows loading state then renders fetched projects', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => MOCK_PROJECTS });
    render(<ProjectsSettingsPage />);
    expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('My App')).toBeInTheDocument();
      expect(screen.getByText('Another Project')).toBeInTheDocument();
    });
  });

  it('renders the Add project button', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => [] });
    render(<ProjectsSettingsPage />);
    await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
  });

  it('shows the project form when Add project is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => [] });
    render(<ProjectsSettingsPage />);
    await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /add project/i }));
    expect(screen.getByPlaceholderText('Enter your project name')).toBeInTheDocument();
  });

  it('adds a new project to the list on successful form submission', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'new-proj' }) });

    render(<ProjectsSettingsPage />);
    await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /add project/i }));
    await userEvent.type(
      screen.getByPlaceholderText('Enter your project name'),
      'My New Project'
    );
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(screen.getByText('My New Project')).toBeInTheDocument();
    });
  });

  it('shows the edit form with pre-filled data when Edit is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => MOCK_PROJECTS });
    render(<ProjectsSettingsPage />);
    await waitFor(() => screen.getByText('My App'));

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);

    expect(screen.getByPlaceholderText('Enter your project name')).toHaveValue('My App');
    expect(screen.getByPlaceholderText('Enter a short description...')).toHaveValue(
      'A cool app'
    );
  });

  it('shows an empty project list message when no projects exist', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => [] });
    render(<ProjectsSettingsPage />);
    await waitFor(() =>
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('validates project name before submitting the form', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ json: async () => [] });
    render(<ProjectsSettingsPage />);
    await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /add project/i }));
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByText('Project name is required')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1); // only the initial load
  });
});
