'use client';

import { create } from 'zustand';

export interface Project {
  id?: string;
  name: string;
  demo_url?: string;
  repo_url?: string;
  description?: string;
  image_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  job_title?: string;
  bio?: string;
  profile_image?: string;
  github_username?: string;
}

interface AppState {
  user: UserProfile | null;
  projects: Project[];
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setProjects: (projects: Project[]) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
  addProject: (project: Project) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  projects: [],
  isLoading: false,

  setUser: (user) => set({ user }),
  setProjects: (projects) => set({ projects }),

  updateProject: (updated) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    })),

  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ user: null, projects: [], isLoading: false }),
}));
