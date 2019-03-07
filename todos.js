const xss = require('xss');
const validator = require('validator');
const {
  query,
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
    if (typeof due !== 'string' || !validator.isISO8601(due)) {
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

async function list(order) {
  const result = await query(`SELECT * FROM items ORDER BY ${order}`);

  return result.rows;
}

async function showCompleted(request) {
  const result = await query('SELECT * FROM items WHERE completed = $1', [request]);

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

async function insert({ title, due, position, completed } = {}) {
  // validate'a gögnin sem við vorum að fá
  const validationResult = validate(title, due, position, completed);

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
    // !isEmpty(completed) ? 'completed' : null,
  ].filter(Boolean);

  const changedValues = [
    xss(title),
    !isEmpty(due) ? xss(due) : null,
    !isEmpty(position) ? xss(position) : null,
    // !isEmpty(completed) ? xss(completed) : null,
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

async function update(id, { title, due, position, completed } = {}) {
  const result = await query('SELECT * FROM items where id = $1', [id]);

  if (result.rows.length === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  const validationResult = validate(title, due, position, completed);

  if (validationResult.length > 0) {
    return {
      success: false,
      notFound: false,
      validation: validationResult,
    };
  }

  const columns = [
    !isEmpty(title) ? 'title' : null,
    !isEmpty(due) ? 'due' : null,
    !isEmpty(position) ? 'position' : null,
    !isEmpty(completed) ? 'completed' : null,
  ].filter(Boolean);

  const changedValues = [
    !isEmpty(title) ? xss(title) : null,
    !isEmpty(due) ? xss(due) : null,
    !isEmpty(position) ? xss(position) : null,
    !isEmpty(completed) ? xss(completed) : null,
  ].filter(Boolean);

  let updates;

  // skítaredding því xss(completed) skilar tómum streng ef completed er false
  if (completed === false) {
    updates = [id, ...changedValues, false];
  } else {
    updates = [id, ...changedValues];
  }

  const updatedColumnsQuery = columns.map((column, i) => `${column} = $${i + 2}`);

  const q = `
    UPDATE items
    SET ${updatedColumnsQuery.join(', ')}
    WHERE id = $1
    RETURNING *`;

  const updateResult = await query(q, updates);

  return {
    success: true,
    notFound: false,
    item: updateResult.rows[0],
  };
}

async function deleteId(id) {
  // athuga fyrst hvort id sé til
  const checkId = await query('SELECT * FROM items WHERE id = $1', [id]);

  // ef id ekki til þá skila að það finnst ekki
  if (checkId.rows.length === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  // annars eyða id
  const result = await query('DELETE FROM items WHERE id = $1', [id]);

  if (result.rowCount === 1) {
    console.info('Færslu eytt');

    return {
      success: true,
      notFound: false,
      validation: [],
    };
  }

  return result.rowCount === 1;
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
  showCompleted,
  getId,
  update,
  validate,
  insert,
  deleteId,
};
