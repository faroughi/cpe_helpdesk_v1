var express = require('express');
var router = express.Router();
var fs = require('fs');
var courseStore = fs.readFileSync(process.cwd()+'/courses.json','utf8');
console.log(courseStore);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/yes',function(req,res,next){
  res.send(JSON.stringify(courseStore));
})

module.exports = router;
