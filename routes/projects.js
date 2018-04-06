var express = require('express');
var router = express.Router();

var models = {};

router.get('/', (req, res, next) => {
  models.Project.findAll().then(projects => {
    res.json(projects);
  });
});

router.get('/:uuid', (req, res, next) => {
  models.Project
    .findById(req.params.uuid)
    .then(project => {
      res.json(project);
    });
});

router.post('/', (req, res, next) => {
  models.Project
    .create({
      group_uuid: req.body.group_uuid,
      name: req.body.name,
      path: req.body.path,
      data: req.body.data
    })
    .then(project => {
      res.json(project);
    })
    .catch(err =>
      res.json(err)
    );
});

router.patch('/:uuid', (req, res, next) => {
  models.Project
    .update(
      {
        group_uuid: req.body.group_uuid,
        name: req.body.name,
        path: req.body.path,
        data: req.body.data
      },
      { where: { uuid: req.params.uuid} }
    ).then(result =>
      res.json(result)
    ).error(err =>
      res.json(err)
    )
});

router.delete('/:uuid', (req, res, next) => {
  models.Project
    .destroy({ where: {uuid: req.params.uuid} })
    .then(result =>
      res.json(result)
    ).error(err =>
      res.json(err)
    )
});

module.exports = router;
