const xss = require('xss');
const validator = require('validator');
const {
  query,
  deleteRow,
} = require('./db');

/* todo útfæra virkni */

function isEmpty(s) {
  return s == null && !s;
}

function validate(title, due, position, completed) {
  const errors = [];

  if (!isEmpty(title)) {
    if (typeof title !== 'string' || title.length === 0 || title.length > 128) {
      errors.push({
        field: 'title',
        error: 'Titill verður að vera strengur sem er 1 til 128 stafir.',
      });
    }
  }

  if (!isEmpty(due)) {
    if (typeof due === 'string' || !validator.isISO8601(due)) {
      errors.push({
        field: 'due',
        error: 'Dagsetning verður að vera gild ISO 8601 dagsetning.',
      });
    }
  }

  if (!isEmpty(position)) {
    if (typeof position !== 'number' || position < 0) {
      errors.push({
        field: 'position',
        error: 'Staðsetning verður að vera heiltala, stærri eða jöfn 0.',
      });
    }
  }

  if (!isEmpty(completed)) {
    if (typeof completed !== 'boolean') {
      errors.push({
        field: 'completed',
        error: 'Lokið verður að vera boolean gildi.',
      });
    }
  }

  return errors;
}

async function list() {
  const result = await query('SELECT * FROM items');

  return result.rows;
}

async function getId(id) {
  const result = await query('SELECT * FROM items WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  return result.rows;
}

async function insert({ title, due, position } = {}) {
  // validate'a gögnin sem við vorum að fá
  const validationResult = validate(title, due, position);

  if (validationResult.length > 0) {
    return {
      success: false,
      notFound: false,
      validation: validationResult,
    };
  }

  const columns = [
    'title',
    !isEmpty(due) ? 'due' : null,
    !isEmpty(position) ? 'position' : null,
  ].filter(Boolean);

  const changedValues = [
    xss(title),
    !isEmpty(due) ? xss(due) : null,
    !isEmpty(position) ? xss(position) : null,
  ].filter(Boolean);

  const updates = [...changedValues];

  const updatedColumnsQuery = columns.map((column, i) => `$${i + 1}`);

  const q = `
    INSERT INTO items
    (${columns.join(',')})
    VALUES
    (${updatedColumnsQuery})
    RETURNING *`;

  const updateResult = await query(q, updates);

  return {
    success: true,
    validation: [],
    item: updateResult.rows[0],
  };
}

async function update(id, item) {
  const result = await deleteRow(id);

  if (result.rows.length === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  const validationResult = validate(item.title, item.due, item.position, item.completed);

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

async function deleteId(id) {
  const result = await query('DELETE FROM items WHERE id = $1', [id]);

  console.info(result.rows.length);

  /*   const item = data.find(i => i.id === parseInt(id, 10));

  if (item) {
    data.splice(data.indexOf(item), 1);
    return res.status(204).end();
  } */

  if (result.rows.length === 0) {
    return {
      success: true,
      notFound: false,
      validation: [],
    };
  }

  return {
    success: false,
    notFound: true,
    validation: [],
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
  validate,
  insert,
  deleteId,
};
