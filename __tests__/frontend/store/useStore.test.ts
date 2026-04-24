import { useStore } from '@/store/useStore';

beforeEach(() => {
  useStore.setState({ user: null, projects: [], isLoading: false });
});

describe('useStore', () => {
  describe('setUser', () => {
    it('stores a user object', () => {
      const user = { id: 'u-1', email: 'test@example.com', name: 'Test' };
      useStore.getState().setUser(user);
      expect(useStore.getState().user).toEqual(user);
    });

    it('accepts null to clear the user', () => {
      useStore.getState().setUser({ id: 'u-1', email: 'a@b.com' });
      useStore.getState().setUser(null);
      expect(useStore.getState().user).toBeNull();
    });
  });

  describe('setProjects', () => {
    it('replaces the projects array', () => {
      useStore.getState().setProjects([{ id: 'p-1', name: 'A' }, { id: 'p-2', name: 'B' }]);
      expect(useStore.getState().projects).toHaveLength(2);
      expect(useStore.getState().projects[0].name).toBe('A');
    });
  });

  describe('addProject', () => {
    it('prepends the new project to the list', () => {
      useStore.getState().setProjects([{ id: 'p-1', name: 'Old' }]);
      useStore.getState().addProject({ id: 'p-2', name: 'New' });
      expect(useStore.getState().projects[0].id).toBe('p-2');
      expect(useStore.getState().projects).toHaveLength(2);
    });
  });

  describe('updateProject', () => {
    it('merges updated fields into the matching project', () => {
      useStore.getState().setProjects([{ id: 'p-1', name: 'Original', description: 'Old' }]);
      useStore.getState().updateProject({ id: 'p-1', name: 'Updated', description: 'New' });
      expect(useStore.getState().projects[0].name).toBe('Updated');
      expect(useStore.getState().projects[0].description).toBe('New');
    });

    it('leaves other projects untouched', () => {
      useStore.getState().setProjects([{ id: 'p-1', name: 'A' }, { id: 'p-2', name: 'B' }]);
      useStore.getState().updateProject({ id: 'p-1', name: 'A2' });
      expect(useStore.getState().projects[1].name).toBe('B');
    });
  });

  describe('removeProject', () => {
    it('removes the project with the matching id', () => {
      useStore.getState().setProjects([{ id: 'p-1', name: 'A' }, { id: 'p-2', name: 'B' }]);
      useStore.getState().removeProject('p-1');
      expect(useStore.getState().projects).toHaveLength(1);
      expect(useStore.getState().projects[0].id).toBe('p-2');
    });
  });

  describe('setLoading', () => {
    it('updates the isLoading flag', () => {
      useStore.getState().setLoading(true);
      expect(useStore.getState().isLoading).toBe(true);
      useStore.getState().setLoading(false);
      expect(useStore.getState().isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('restores all state to initial values', () => {
      useStore.getState().setUser({ id: 'u-1', email: 'a@b.com' });
      useStore.getState().setProjects([{ id: 'p-1', name: 'P' }]);
      useStore.getState().setLoading(true);
      useStore.getState().reset();
      expect(useStore.getState().user).toBeNull();
      expect(useStore.getState().projects).toHaveLength(0);
      expect(useStore.getState().isLoading).toBe(false);
    });
  });
});
