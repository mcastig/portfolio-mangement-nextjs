import { render, waitFor } from '@testing-library/react';
import DashboardInit from '@/components/DashboardInit/DashboardInit';

const mockSetUser = jest.fn();
const mockUseStore = jest.fn();

jest.mock('@/store/useStore', () => ({
  useStore: (selector: (s: unknown) => unknown) => mockUseStore(selector),
}));

global.fetch = jest.fn();

function setupStore(user: { id: string } | null = null) {
  mockUseStore.mockImplementation(
    (selector: (s: { setUser: typeof mockSetUser; user: typeof user }) => unknown) =>
      selector({ setUser: mockSetUser, user })
  );
}

describe('DashboardInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStore();
  });

  it('renders nothing (returns null)', () => {
    setupStore({ id: 'user-123' }); // userId matches → no fetch
    const { container } = render(<DashboardInit userId="user-123" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('fetches the user profile and calls setUser when userId differs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ id: 'user-123', email: 'test@example.com' }),
    });
    render(<DashboardInit userId="user-123" />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/profile');
      expect(mockSetUser).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
      });
    });
  });

  it('does not fetch when the stored userId already matches', () => {
    setupStore({ id: 'user-123' });
    render(<DashboardInit userId="user-123" />);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not call setUser when the response contains no id', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ error: 'Unauthorized' }),
    });
    render(<DashboardInit userId="user-123" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await Promise.resolve();
    await Promise.resolve();
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});
