import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

test('application loads and shows forms from the backend', async () => {
  const forms = [
    {
      id: 1,
      name: 'Feedback Form',
      description: 'Capture product feedback',
      created_at: '2026-08-11T12:00:00.000Z',
    },
  ];

  global.fetch = vi.fn(async (url) => {
    if (url === '/health') {
      return createResponse({ status: 'healthy', database: 'connected', version: 'abc123' });
    }

    if (url === '/version') {
      return createResponse({ version: 'abc123' });
    }

    if (url === '/api/forms') {
      return createResponse({ forms });
    }

    return createResponse({ error: 'Not found' }, 404);
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Feedback Form')).toBeInTheDocument();
  });

  expect(screen.getByText('API healthy')).toBeInTheDocument();
  expect(screen.getByText('abc123')).toBeInTheDocument();
});

test('user can create and delete a form', async () => {
  const forms = [
    {
      id: 1,
      name: 'Feedback Form',
      description: 'Capture product feedback',
      created_at: '2026-08-11T12:00:00.000Z',
    },
  ];

  let nextId = 2;

  global.fetch = vi.fn(async (url, options = {}) => {
    if (url === '/health') {
      return createResponse({ status: 'healthy', database: 'connected', version: 'abc123' });
    }

    if (url === '/version') {
      return createResponse({ version: 'abc123' });
    }

    if (url === '/api/forms' && (!options.method || options.method === 'GET')) {
      return createResponse({ forms: [...forms] });
    }

    if (url === '/api/forms' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      forms.unshift({
        id: nextId++,
        name: body.name,
        description: body.description,
        created_at: '2026-08-11T13:00:00.000Z',
      });
      return createResponse({ message: 'Form created successfully.', form: forms[0] }, 201);
    }

    if (url === '/api/forms/1' && options.method === 'DELETE') {
      forms.splice(
        forms.findIndex((item) => item.id === 1),
        1
      );
      return createResponse({ message: 'Form deleted successfully.' });
    }

    return createResponse({ error: 'Unexpected request' }, 500);
  });

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('Feedback Form')).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText('Form name'), {
    target: { value: 'New Form' },
  });
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'A newly created form' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create form' }));

  await waitFor(() => {
    expect(screen.getByText('New Form')).toBeInTheDocument();
  });

  fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);

  await waitFor(() => {
    expect(screen.queryByText('Feedback Form')).not.toBeInTheDocument();
  });
});
