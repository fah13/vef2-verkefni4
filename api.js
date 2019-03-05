const express = require('express');
const {
  list,
  getId,
  update,
  validate,
  insert,
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

async function selectId(req, res) {
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
  const { title, text } = req.body;

  const result = await update(id, { title, text });

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  return res.status(200).json(result.item);
}

/* todo útfæra vefþjónustuskil */

router.get('/', catchErrors(listRoute));
router.get('/:id', catchErrors(selectId));
router.post('/', catchErrors(postRoute));
router.patch('/:id', catchErrors(patchRoute));


module.exports = router;
