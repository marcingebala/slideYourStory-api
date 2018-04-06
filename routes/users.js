var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var jwt    = require('jsonwebtoken');
//var models = require('../models');
var models = {};
import User from '../models/user';

router.get('/', function(req, res, next) {
/*  models.User.findAll().then(function(users) {
    res.json(users);
  });*/
});

router.get('/:uuid', function(req, res, next) {
  /*models.User.findById(req.params.uuid).then(function(user) {
    res.json(user);
  });*/
});


router.post('/ws', function(req, res) {
const io = req.app.get('socket.io');
io.to(req.body.uuid).emit('default', req.body.message)
    io.emit(req.body.uuid,req.body.message);
   console.log('message: ' + req.body.message);


 res.json('done');

});

router.post('/', function(req, res) {

  const user = new User();
  user.email = req.body.email
  user.password =  bcrypt.hashSync(req.body.password, 10)
  user.domains = req.body.domains

  user.save( err => {
    if (err) res.send(err);
    else res.json(user);
  });

/*
  models.User.create({
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  })
  .then( user => {
    console.log('USER!: ',user);
    return models.Domain.findById('73d5292c-5b6c-4fd3-8c33-f8f4d1aba51a')
      .then( domain => { return {user:user, domain:domain} })
  })
  .then( (user, domain) => {
    console.log('userDomain', user, domain)
    user.addDomains(domain);
  })
  .then( () => {
    res.json(user);
  }).catch(err => {
    console.log(err)
    console.log('3');
    res.json(err)
  });*/
});

router.post('/login', (req, res, next) =>
  models.User
  .findOne({where: {email: req.body.email}})
  .then(user => {
    if(bcrypt.compareSync(req.body.password, user.password)){
      var token = jwt.sign({email:user.email,uuid:user.uuid},'lovePoland&Warsaw',{expiresIn:1440})
      return res.json({token:token});
    } else {
      console.log('reject');
      return reject('login failed')
    }
  })
  .error(err => {
    res.json(err);
  })
);

router.patch('/:uuid', function(req, res, next) {
  var password = req.body.password ? bcrypt.hashSync(req.body.password, 10) : req.body.password;
  models.User.update(
    { email : req.body.email, password: password },
    { where: { uuid: req.params.uuid} }
  ).then(result =>
    res.json(result)
  ).error(err =>
    res.json(err)
  )
});

router.delete('/:uuid', function(req, res, next) {
  models.User
  .destroy({ where: {uuid: req.params.uuid} })
  .then(result =>
    res.json(result)
  ).error(err =>
    res.json(err)
  )
});

module.exports = router;
