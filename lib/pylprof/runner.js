'use babel';

// 3p
import _ from 'underscore-plus';
import fs from 'fs';
import path from 'path';
import Q from 'q';
import { spawn } from 'child_process';

const CMD_CONFIG = [
    {
        name: 'dumpStats',
        source: 'dump-stats.py'
    },
    {
        name: 'imports',
        source: 'imports.py'
    }
];

class PyLprof {
    loadProfilerCommands(cmdConfig) {
        let commands = {};
        cmdConfig.forEach(cmd => {
            let cmdfile = path.resolve(__dirname, cmd.source);
            commands[cmd.name] = fs.readFileSync(cmdfile, 'utf8');
        });
        return commands;
    }

    formatFileStats(data) {
        let formatted = [];
        for (let linenum in data) {
            data[linenum].forEach(l => {
                formatted.push({
                    line: parseInt(linenum) - 1,
                    timing: l.timing
                });
            });
        }
        // return an array of [{line, timing}]
        return formatted;
    }

    decodeStats(data) {
        // isolate stats section from stdout and parse
        data = data.match('statsstart(.*)statsend')[1];
        data = JSON.parse(data);

        // format stats
        let formatted = [];
        for (let filename in data) {
            formatted.push({
                file: filename,
                stats: this.formatFileStats(data[filename])
            });
        }

        // return an array of [{file, stats}]
        return formatted;
    }

    getStatements(userInput) {
        let commands = this.loadProfilerCommands(CMD_CONFIG);
        return [commands.imports, userInput, commands.dumpStats].join('\n\n');
    }

    getInterpreter() {
        let shellCmd = atom.config.get('python-line-profiler.shellCmd');
        let binary = _.first(shellCmd);
        let args = _.rest(shellCmd);

        return {
            binary,
            args
        };
    }

    decodeError(stderr) {
        if (stderr.includes('No module named line_profiler')) {
            return {
                style: 'notification',
                message: 'Looks like you did not install line_profiler. ' +
                    'Check out https://github.com/iddl/pprofile#requirements ' +
                    'for more info.'
            };
        } else {
            return {
                style: 'output',
                message: stderr
            };
        }
    }

    run({ context, userInput }) {
        let deferred = Q.defer();

        // get bin name, args and statements to execute
        let { binary, args } = this.getInterpreter();
        let statements = this.getStatements(userInput);

        // spawn and pipe statements
        let child = spawn(binary, args, {
            cwd: context
        });

        let stderr = '';
        child.stderr.on('data', d => {
            stderr += d.toString();
        });

        let stdout = '';
        child.stdout.on('data', d => {
            stdout += d.toString();
        });

        // wait for stdio streams to close before parsing
        // result
        child.on('close', () => {
            try {
                deferred.resolve({
                    stats: this.decodeStats(stdout),
                    message: stderr
                });
            } catch (err) {
                deferred.reject(this.decodeError(stderr));
            }
        });

        child.stdin.write(statements);
        child.stdin.end();

        return deferred.promise;
    }
}

PyLprof.config = {
    shellCmd: {
        title: 'Shell command',
        type: 'array',
        default: ['/usr/bin/python'],
        items: {
            type: 'string'
        }
    }
};

module.exports = PyLprof;
