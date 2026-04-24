import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSettingsPage from '@/app/(dashboard)/settings/profile/page';

const mockSetUser = jest.fn();
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
  bio: 'Hello world',
  profile_image: null,
};

function setupStore(user = MOCK_USER) {
  mockUseStore.mockImplementation(
    (selector: (s: { user: typeof MOCK_USER; setUser: typeof mockSetUser }) => unknown) =>
      selector({ user, setUser: mockSetUser })
  );
}

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
  });

  it('renders the profile settings form', () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByText('Profile settings')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your job title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a short introduction..')).toBeInTheDocument();
  });

  it('prepopulates form fields from the user in the store', () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByPlaceholderText('Enter your name')).toHaveValue('Test User');
    expect(screen.getByPlaceholderText('Enter your job title')).toHaveValue('Developer');
    expect(screen.getByPlaceholderText('Enter a short introduction..')).toHaveValue(
      'Hello world'
    );
  });

  it('displays the disabled email field', () => {
    render(<ProfileSettingsPage />);
    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('shows Upload Profile Image button', () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByRole('button', { name: /upload profile image/i })).toBeInTheDocument();
  });

  it('shows success message after a successful save', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<ProfileSettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText('Profile saved successfully')).toBeInTheDocument();
    });
  });

  it('shows error message when save fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });
    render(<ProfileSettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  it('updates the user in the store after a successful save', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<ProfileSettingsPage />);
    await userEvent.clear(screen.getByPlaceholderText('Enter your name'));
    await userEvent.type(screen.getByPlaceholderText('Enter your name'), 'New Name');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' })
      );
    });
  });

  it('disables Save button while saving', async () => {
    let resolve: (v: unknown) => void;
    (fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<ProfileSettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    resolve!({ ok: true, json: async () => ({}) });
  });
});
