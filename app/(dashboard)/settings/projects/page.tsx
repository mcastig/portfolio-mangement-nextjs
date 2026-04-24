'use client';

import '../settings.css';
import './projects.css';
import { useState, useEffect, useRef } from 'react';
import { useStore, Project } from '@/store/useStore';

interface ProjectFormState {
  id?: string;
  name: string;
  demo_url: string;
  repo_url: string;
  description: string;
  image_url: string;
}

const emptyForm: ProjectFormState = {
  name: '',
  demo_url: '',
  repo_url: '',
  description: '',
  image_url: '',
};

function ProjectForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ProjectFormState;
  onSave: (data: ProjectFormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProjectFormState>(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, image_url: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch {
      setError('Save failed, please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-card">
      <form onSubmit={handleSubmit}>
        <div className="image-upload-zone" style={{ marginBottom: '1.25rem' }}>
          <div className="upload-preview">
            {form.image_url ? (
              <img src={form.image_url} alt="Project" className="preview-photo" />
            ) : (
              <img src="/multiple image.svg" alt="" className="preview-icon" />
            )}
          </div>
          <p className="image-upload-hint">Image must be PNG or JPEG - max 2MB</p>
          <div className="upload-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
              <img src="/upload.svg" alt="" width={16} height={16} />
              Upload Image
            </button>
            {form.image_url && (
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => { setForm((f) => ({ ...f, image_url: '' })); if (fileRef.current) fileRef.current.value = ''; }}
              >
                <img src="/Trash.svg" alt="" width={16} height={16} />
                Delete Image
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        {error && <div className="message message-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
          <div className="field">
            <label>Project Name</label>
            <input className="input" type="text" placeholder="Enter your project name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Demo URL</label>
            <input className="input" type="url" placeholder="Enter the demo URL" value={form.demo_url} onChange={(e) => setForm((f) => ({ ...f, demo_url: e.target.value }))} />
          </div>
        </div>

        <div className="field" style={{ marginBottom: '1rem' }}>
          <label>Repository URL</label>
          <input className="input" type="url" placeholder="Enter the repository URL" value={form.repo_url} onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))} />
        </div>

        <div className="field" style={{ marginBottom: '1rem' }}>
          <label>Description</label>
          <textarea className="input" placeholder="Enter a short description..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
        </div>

        <div className="project-form-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
            <img src="/Trash-1.svg" alt="" width={16} height={16} />
            Remove
          </button>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'auto' }} disabled={saving}>
            <img src="/Plus-1.svg" alt="" width={16} height={16} />
            {saving ? 'Saving...' : (form.id ? 'Update' : 'Add')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProjectsSettingsPage() {
  const projects = useStore((s) => s.projects);
  const setProjects = useStore((s) => s.setProjects);
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);
  const removeProject = useStore((s) => s.removeProject);

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectFormState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/projects')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .finally(() => setLoading(false));
  }, [setProjects]);

  async function handleAddSave(data: ProjectFormState) {
    const res = await fetch('/api/user/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    addProject({ ...data, id: result.id });
    setShowForm(false);
  }

  async function handleEditSave(data: ProjectFormState) {
    const res = await fetch('/api/user/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    updateProject(data as Project);
    setEditingProject(null);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/user/projects/${id}`, { method: 'DELETE' });
    if (res.ok) removeProject(id);
    setEditingProject(null);
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Projects settings</h1>

      <button
        className="add-project-btn"
        onClick={() => { setShowForm(true); setEditingProject(null); }}
      >
        <img src="/Plus.svg" alt="" />
        Add project
      </button>

      {showForm && !editingProject && (
        <ProjectForm
          onSave={handleAddSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingProject && (
        <ProjectForm
          initial={editingProject}
          onSave={handleEditSave}
          onCancel={() => {
            if (editingProject.id) handleDelete(editingProject.id);
            else setEditingProject(null);
          }}
        />
      )}

      {loading ? (
        <p className="text-muted text-sm">Loading projects...</p>
      ) : (
        <div>
          {projects.map((project) => (
            <div key={project.id} className="project-item">
              <div className="project-item-image">
                {project.image_url ? (
                  <img src={project.image_url} alt={project.name} className="project-photo" />
                ) : (
                  <img src="/multiple image.svg" alt="" className="project-placeholder" />
                )}
              </div>
              <div className="project-item-body">
                <div className="project-item-name">{project.name}</div>
                {project.description && (
                  <p className="project-item-desc">{project.description}</p>
                )}
                <button
                  className="btn-edit"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProject({
                      id: project.id,
                      name: project.name,
                      demo_url: project.demo_url || '',
                      repo_url: project.repo_url || '',
                      description: project.description || '',
                      image_url: project.image_url || '',
                    });
                  }}
                >
                  <img src="/Pencil.svg" alt="" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
