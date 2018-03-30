var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({name:'api RI', status: 'everythink is ok'});
});

module.exports = router;
