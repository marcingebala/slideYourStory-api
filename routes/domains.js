var express = require('express');
var router = express.Router();

var models = {};

router.get('/', function(req, res, next) {
  models.Domain.findAll().then(function(domains) {
    res.json(domains);
  });
});

router.get('/:uuid', function(req, res, next) {
  models.Domain.findById(req.params.uuid).then(function(group) {
    res.json(group);
  });
});

router.post('/', function(req, res) {
  models.Domain.create({
    accepted: req.body.accepted,
    name: req.body.name.toLowerCase()
  }).then(function(group) {
    res.json({
      name: group.name,
      accepted: group.accepted,
      uuid: group.uuid
    });
  }).catch(function(err){
    res.json(err)
  });
});

router.patch('/:uuid', function(req, res, next) {
  models.Domain.update(
    { accepte : req.body.accepte, name: req.body.name.toLowerCase() },
    { where: { uuid: req.params.uuid} }
  ).then(result =>
    res.json(result)
  ).error(err =>
    res.json(err)
  )
});

router.delete('/:uuid', function(req, res, next) {
  models.Domain
  .destroy({ where: {uuid: req.params.uuid} })
  .then(result =>
    res.json(result)
  ).error(err =>
    res.json(err)
  )
});

module.exports = router;
