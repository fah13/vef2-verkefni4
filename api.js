const express = require('express');
const {
  list,
  getId,
  update,
  insert,
  deleteId,
} = require('./todos');

/* todo importa frá todos.js */

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function listRoute(req, res) {
  // const {orderby, completed } = req.query;

  const items = await list();

  return res.json(items);
}

async function selectRoute(req, res) {
  const { id } = req.params;
  const result = await getId(id);

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(200).json(result);
}

async function postRoute(req, res) {
  const { title, due, position } = req.body;

  const result = await insert({ title, due, position });

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  return res.status(200).json(result.item);
}

async function patchRoute(req, res) {
  const { id } = req.params;
  const { title, due, position, completed } = req.body;

  if (req.body.length === undefined) {
    return res.status(400).json({ error: 'No content' });
  }

  const result = await update(id, { title, due, position, completed });

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  return res.status(200).json(result.item);
}

async function deleteRoute(req, res) {
  const { id } = req.params;

  const result = await deleteId(id);

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(204).end();
}

/* todo útfæra vefþjónustuskil */

router.get('/', catchErrors(listRoute));
router.get('/:id', catchErrors(selectRoute));
router.post('/', catchErrors(postRoute));
router.patch('/:id', catchErrors(patchRoute));
router.delete('/:id', catchErrors(deleteRoute));


module.exports = router;
