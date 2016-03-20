"use babel";

// 3p
import _ from 'underscore-plus';
import fs from 'fs';
import path from 'path';
import Q from 'q';
import { spawn } from 'child_process';

const CMD_CONFIG = [{
    name: 'importProfiler',
    source: 'imports.py'
}, {
    name: 'dumpStats',
    source: 'dump-stats.py'
}];

class PyLprof {

    loadProfilerCommands(cmdConfig) {
        let commands;
        commands = {};
        cmdConfig.forEach(function(cmd) {
            let cmdfile;
            cmdfile = path.resolve(__dirname, cmd.source);
            return commands[cmd.name] = fs.readFileSync(cmdfile, 'utf8');
        });
        return commands;
    }

    format(stats) {
        let formatted;
        formatted = [];
        _.each(stats, function(filestats, filename) {
            let fstats;
            fstats = {
                file: filename,
                stats: []
            };
            _.each(filestats, function(lstats, lineno) {
                return lstats.forEach(function(l) {
                    let line;
                    let s;
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
    }

    profile(cmd) {
        let args;
        let child;
        let commands;
        let deferred;
        let exec;
        let shellCmd;
        let stderr;
        let stdout;
        deferred = Q.defer();
        commands = this.loadProfilerCommands(CMD_CONFIG);
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
                let error;
                let error1;
                let m;
                let stats;
                try {
                    m = (stdout.match('statsstart(.*)statsend'))[1];
                    stats = JSON.parse(m);
                    stats = _this.format(stats);
                    return deferred.resolve({
                        stats: stats,
                        message: stderr
                    });
                } catch ( error1 ) {
                    error = error1;
                    return deferred.reject({
                        message: stderr
                    });
                }
            };
        })(this));
        return deferred.promise;
    }

    run(cmd) {
        let deferred;
        deferred = Q.defer();
        return this.profile(cmd);
    }

}


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

module.exports = PyLprof;
