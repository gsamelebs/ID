const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');

function createMockStore() {
  const state = {
    forms: [
      { id: 1, name: 'Contact Us', description: 'Customer support form', created_at: '2026-08-11T00:00:00.000Z' },
    ],
  };

  return {
    state,
    async healthCheck() {
      return true;
    },
    async listForms() {
      return state.forms;
    },
    async createForm({ name, description }) {
      const form = {
        id: state.forms.length + 1,
        name,
        description,
        created_at: '2026-08-11T01:00:00.000Z',
      };
      state.forms.unshift(form);
      return form;
    },
    async deleteForm(id) {
      const index = state.forms.findIndex((form) => form.id === id);
      if (index === -1) {
        return false;
      }
      state.forms.splice(index, 1);
      return true;
    },
  };
}

async function startServer(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  return { server, port };
}

test('health endpoint reports database connectivity', async () => {
  const store = createMockStore();
  const app = createApp({ formsStore: store, version: 'abc123' });
  const { server, port } = await startServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, 'healthy');
    assert.equal(payload.database, 'connected');
    assert.equal(payload.version, 'abc123');
  } finally {
    server.close();
  }
});

test('lists forms', async () => {
  const store = createMockStore();
  const app = createApp({ formsStore: store });
  const { server, port } = await startServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/forms`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.forms.length, 1);
    assert.equal(payload.forms[0].name, 'Contact Us');
  } finally {
    server.close();
  }
});

test('creates a form', async () => {
  const store = createMockStore();
  const app = createApp({ formsStore: store });
  const { server, port } = await startServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo Form',
        description: 'A demo form',
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.form.name, 'Demo Form');
    assert.equal(store.state.forms[0].name, 'Demo Form');
  } finally {
    server.close();
  }
});

test('deletes a form', async () => {
  const store = createMockStore();
  const app = createApp({ formsStore: store });
  const { server, port } = await startServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/forms/1`, {
      method: 'DELETE',
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.message, 'Form deleted successfully.');
    assert.equal(store.state.forms.length, 0);
  } finally {
    server.close();
  }
});

test('rejects invalid form data', async () => {
  const store = createMockStore();
  const app = createApp({ formsStore: store });
  const { server, port } = await startServer(app);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', description: '' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.match(payload.error, /required/);
  } finally {
    server.close();
  }
});
