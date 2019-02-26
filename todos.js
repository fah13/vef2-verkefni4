const xss = require('xss');
const { query } = require('./db');

/* todo útfæra virkni */

async function list() {
  const result = await query('SELECT * FROM items');

  return result.rows;
}

async function getId(id) {
  const result = await query('SELECT * FROM items WHERE id = $1', [id]);

  return result.rows;
}


function isEmpty(s) {
  return s == null && !s;
}

function validate(title, text) {
  const errors = [];

  if (!isEmpty(title)) {
    if (typeof title !== 'string' || title.length === 0) {
      errors.push({
        field: 'title',
        error: 'Title must be a non-empty string',
      });
    }
  }

  if (!isEmpty(text)) {
    if (typeof text !== 'string' || text.length === 0) {
      errors.push({
        field: 'text',
        error: 'Text must be a non-empty string',
      });
    }
  }

  return errors;
}

async function update(id, item) {
  const result = await query('SELECT * FROM items where id = $1', [id]);

  if (result.rows.length === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  const validationResult = validate(item.title, item.text);

  if (validationResult.length > 0) {
    return {
      success: false,
      notFound: false,
      validation: validationResult,
    };
  }
  const changedColumns = [
    !isEmpty(item.title) ? 'title' : null,
    !isEmpty(item.text) ? 'text' : null,
  ].filter(Boolean);

  const changedValues = [
    !isEmpty(item.title) ? xss(item.title) : null,
    !isEmpty(item.text) ? xss(item.text) : null,
  ].filter(Boolean);

  const updates = [id, ...changedValues];

  const updatedColumnsQuery = changedColumns.map((column, i) => `${column} = $${i + 2}`);

  const q = `
    UPDATE items
    SET ${updatedColumnsQuery.join(', ')}
    WHERE id = $1
    RETURNING id, title, text`;

  const updateResult = await query(q, updates);

  return {
    success: true,
    item: updateResult.rows[0],
  };
}

/* 
function getTodos(completed, orderby = 'asc') {
  const orderString = orderby.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  if (completed === false || completed === 'true')
 
  `SELECT id, title, ...., WHERE complted = .... ORDER BY ....`
  `SELECT id, title, ...., ORDER BY ....`
}
 */

module.exports = {
  list,
  getId,
  update,
};
