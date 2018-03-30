var express = require('express');
var router = express.Router();

var models = require('../models');

router.get('/', function(req, res, next) {
  models.Group.findAll().then(function(groups) {
    res.json(groups);
  });
});

router.get('/:uuid', function(req, res, next) {
  models.Group.findById(req.params.uuid).then(function(group) {
    res.json(group);
  });
});

router.post('/', function(req, res) {
  models.Group.create({
    domain: req.body.domain,
    name: req.body.name
  }).then(function(group) {
    res.json({
      name: group.name,
      domain: group.domain,
      uuid: group.uuid
    });
  }).catch(function(err){
    res.json(err)
  });
});

router.patch('/:uuid', function(req, res, next) {
  models.Group.update(
    { domain : req.body.domain, name: req.body.name },
    { where: { uuid: req.params.uuid} }
  ).then(result =>
    res.json(result)
  ).error(err =>
    res.json(err)
  )
});

router.delete('/:uuid', function(req, res, next) {
  models.Group
  .destroy({ where: {uuid: req.params.uuid} })
  .then(result =>
    res.json(result)
  ).error(err =>
    res.json(err)
  )
});

module.exports = router;
