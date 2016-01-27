
var __dirname = '/Users/hyeomans/development/my-opentable';

var createHash = require('crypto').createHash,
    filewalker = require('filewalker'),
    moment = require('moment'),
    start = moment().format(),
    started = Date.now(),
    db = {};

var options = {
  maxPending: 10, // throttle handles,
  matchRegExp: /.+\.resx/
};

filewalker(__dirname, options)
  .on('stream', function(rs, p, s, fullPath) {
    var hash = createHash('md5');
    rs.on('data', function(data) {
      hash.update(data);
    });
    rs.on('end', function(data) {
      var digest = hash.digest('hex');
      db[p] = {
        digest: digest,
        lastUpdated: start
      };
    });
  })
  .on('error', function(err) {
    console.error(err);
  })
  .on('done', function() {
    var dateNow = Date.now();
    var duration = dateNow-started;
    console.log('%d ms', duration);
    console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
    console.log(db);
  })
.walk();