const express = require('express');
const cors = require('cors');

function createApp({ formsStore, version = 'dev' }) {
  if (!formsStore) {
    throw new Error('formsStore is required');
  }

  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());

  app.get('/version', (req, res) => {
    res.json({ version });
  });

  app.get('/health', async (req, res) => {
    try {
      await formsStore.healthCheck();
      res.json({
        status: 'healthy',
        database: 'connected',
        version,
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        version,
      });
    }
  });

  app.get('/api/forms', async (req, res, next) => {
    try {
      const forms = await formsStore.listForms();
      res.json({ forms });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/forms', async (req, res, next) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

      if (!name || !description) {
        return res.status(400).json({
          error: 'Both name and description are required.',
        });
      }

      const form = await formsStore.createForm({ name, description });
      res.status(201).json({
        message: 'Form created successfully.',
        form,
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/forms/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: 'A valid numeric form id is required.',
        });
      }

      const deleted = await formsStore.deleteForm(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Form not found.',
        });
      }

      res.json({
        message: 'Form deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

module.exports = { createApp };
