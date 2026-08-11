const { Pool } = require('pg');

function createPool() {
  return new Pool({
    host: process.env.DATABASE_HOST || 'database',
    port: Number(process.env.DATABASE_PORT || 5432),
    database: process.env.DATABASE_NAME || 'formflow',
    user: process.env.DATABASE_USER || 'formflow_user',
    password: process.env.DATABASE_PASSWORD || 'CHANGE_ME',
    ssl: false,
  });
}

function createFormsStore(pool) {
  return {
    async healthCheck() {
      await pool.query('SELECT 1');
      return true;
    },

    async listForms() {
      const result = await pool.query(
        `SELECT id, name, description, created_at
         FROM forms
         ORDER BY created_at DESC, id DESC`
      );
      return result.rows;
    },

    async createForm({ name, description }) {
      const result = await pool.query(
        `INSERT INTO forms (name, description)
         VALUES ($1, $2)
         RETURNING id, name, description, created_at`,
        [name, description]
      );
      return result.rows[0];
    },

    async deleteForm(id) {
      const result = await pool.query(
        'DELETE FROM forms WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rowCount > 0;
    },
  };
}

module.exports = {
  createPool,
  createFormsStore,
};
