import { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  name: '',
  description: '',
};

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function App() {
  const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const apiPath = (path) => `${apiBaseUrl}${path}`;
  const [forms, setForms] = useState([]);
  const [status, setStatus] = useState('checking');
  const [version, setVersion] = useState('loading');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  const statusText = useMemo(() => {
    switch (status) {
      case 'healthy':
        return 'API healthy';
      case 'unhealthy':
        return 'API unavailable';
      default:
        return 'Checking API...';
    }
  }, [status]);

  async function fetchJson(path, options) {
    const response = await fetch(apiPath(path), options);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Request failed');
    }

    return payload;
  }

  async function refreshForms() {
    const payload = await fetchJson('/api/forms');
    setForms(payload.forms || []);
  }

  async function refreshStatus() {
    try {
      const [health, release, formList] = await Promise.all([
        fetchJson('/health'),
        fetchJson('/version'),
        fetchJson('/api/forms'),
      ]);

      setStatus(health.status);
      setVersion(release.version || 'unknown');
      setForms(formList.forms || []);
    } catch (error) {
      setStatus('unhealthy');
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await fetchJson('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      setForm(emptyForm);
      setMessageType('success');
      setMessage('Form created successfully.');
      await refreshForms();
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setMessage(null);

    try {
      await fetchJson(`/api/forms/${id}`, {
        method: 'DELETE',
      });

      setMessageType('success');
      setMessage('Form deleted successfully.');
      await refreshForms();
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero card">
        <div>
          <p className="eyebrow">FormFlow</p>
          <h1>Manage forms with a simple, production-style stack.</h1>
          <p className="hero-copy">
            Create, review, and remove forms through a responsive frontend backed by a REST API and PostgreSQL.
          </p>
        </div>

        <div className="status-grid">
          <div className={`status-pill ${status === 'healthy' ? 'status-success' : 'status-warning'}`}>
            <span>{statusText}</span>
          </div>
          <div className="meta-card">
            <span className="meta-label">Version</span>
            <strong>{version}</strong>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="card-header">
            <h2>Create a form</h2>
            <p>Submit a new form to the backend API.</p>
          </div>

          <label>
            <span>Form name</span>
            <input
              name="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Customer feedback"
              required
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Capture customer sentiment after a support call"
              rows="5"
              required
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create form'}
          </button>

          {message ? (
            <div className={`feedback ${messageType === 'success' ? 'feedback-success' : 'feedback-error'}`}>
              {message}
            </div>
          ) : null}
        </form>

        <section className="card list-card" aria-live="polite">
          <div className="card-header">
            <h2>Existing forms</h2>
            <p>{loading ? 'Loading forms...' : `${forms.length} form(s) available`}</p>
          </div>

          <div className="form-list">
            {forms.length === 0 ? (
              <div className="empty-state">
                <h3>No forms yet</h3>
                <p>Create your first form to populate the dashboard.</p>
              </div>
            ) : (
              forms.map((item) => (
                <article className="form-item" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>

                  <div className="form-meta">
                    <span>Created {formatDate(item.created_at)}</span>
                    <button type="button" className="secondary-button" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
