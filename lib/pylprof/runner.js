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
        let commands = {};
        cmdConfig.forEach((cmd) => {
            let cmdfile = path.resolve(__dirname, cmd.source);
            return commands[cmd.name] = fs.readFileSync(cmdfile, 'utf8');
        });
        return commands;
    }

    format(stats) {
        let formatted = [];
        _.each(stats, (filestats, filename) => {
            let fstats = {
                file: filename,
                stats: []
            };
            _.each(filestats, (lstats, lineno) => {
                return lstats.forEach((l) => {
                    let line = (parseInt(lineno)) - 1;
                    let s = _.extend(l, {
                        line: line
                    });
                    return fstats.stats.push(s);
                });
            });
            return formatted.push(fstats);
        });
        return formatted;
    }

    run(cmd) {
        let self = this;

        let stderr = '';
        let stdout = '';

        let deferred = Q.defer();
        let commands = this.loadProfilerCommands(CMD_CONFIG);
        let shellCmd = atom.config.get('PProfile.shellCmd');
        let binary = _.first(shellCmd);
        let args = _.rest(shellCmd);
        let child = spawn(binary, args);

        cmd = [commands.importProfiler, cmd, commands.dumpStats].join('\n\n');

        child.stdin.write(cmd);

        child.stderr.on('data', d => stderr += d.toString());

        child.stdout.on('data', d => stdout += d.toString());

        child.on('exit', () => {
            try {
                let statsdump = (stdout.match('statsstart(.*)statsend'))[1];
                let stats = JSON.parse(statsdump);
                stats = this.format(stats);
                deferred.resolve({
                    stats: stats,
                    message: stderr
                });
            } catch ( err ) {
                deferred.reject({
                    message: stderr
                });
            }
        });

        return deferred.promise;
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
