
  var PyLprof, Q, _, fs, path, spawn;

  fs = require('fs');

  Q = require('q');

  spawn = require('child_process').spawn;

  path = require('path');

  _ = require('underscore-plus');

  PyLprof = (function() {
    function PyLprof() {}

    PyLprof.config = {
      shellCmd: {
        title: 'Shell command',
        type: 'array',
        "default": ['/usr/bin/python'],
        items: {
          type: 'string'
        }
      }
    };

    PyLprof.prototype.cmdConfig = [
      {
        name: 'importProfiler',
        source: 'imports.py'
      }, {
        name: 'dumpStats',
        source: 'dump-stats.py'
      }
    ];

    PyLprof.prototype.loadProfilerCommands = function(cmdConfig) {
      var commands;
      commands = {};
      cmdConfig.forEach(function(cmd) {
        var cmdfile;
        cmdfile = path.resolve(__dirname, cmd.source);
        return commands[cmd.name] = fs.readFileSync(cmdfile, 'utf8');
      });
      return commands;
    };

    PyLprof.prototype.format = function(stats) {
      var formatted;
      formatted = [];
      _.each(stats, function(filestats, filename) {
        var fstats;
        fstats = {
          file: filename,
          stats: []
        };
        _.each(filestats, function(lstats, lineno) {
          return lstats.forEach(function(l) {
            var line, s;
            line = (parseInt(lineno)) - 1;
            s = _.extend(l, {
              line: line
            });
            return fstats.stats.push(s);
          });
        });
        return formatted.push(fstats);
      });
      return formatted;
    };

    PyLprof.prototype.profile = function(cmd) {
      var args, child, commands, deferred, exec, shellCmd, stderr, stdout;
      deferred = Q.defer();
      commands = this.loadProfilerCommands(this.cmdConfig);
      shellCmd = atom.config.get('PProfile.shellCmd');
      exec = _.first(shellCmd);
      args = _.rest(shellCmd);
      child = spawn(exec, args);
      cmd = [commands.importProfiler, cmd, commands.dumpStats].join('\n\n');
      stdout = '';
      stderr = '';
      child.stdin.write(cmd);
      child.stderr.on('data', function(data) {
        return stderr += data.toString();
      });
      child.stdout.on('data', function(data) {
        return stdout += data.toString();
      });
      child.on('exit', (function(_this) {
        return function(code) {
          var error, error1, m, stats;
          try {
            m = (stdout.match('statsstart(.*)statsend'))[1];
            stats = JSON.parse(m);
            stats = _this.format(stats);
            return deferred.resolve({
              stats: stats,
              message: stderr
            });
          } catch (error1) {
            error = error1;
            return deferred.reject({
              message: stderr
            });
          }
        };
      })(this));
      return deferred.promise;
    };

    PyLprof.prototype.run = function(cmd) {
      var deferred;
      deferred = Q.defer();
      return this.profile(cmd);
    };

    return PyLprof;

  })();

  module.exports = PyLprof;
