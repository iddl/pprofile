'use babel';

// 3p
import _ from 'underscore-plus';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import path from 'path';

// project
import LauncherView from './utils/views/launcher-view.jsx';
import PyLprof from './pylprof/runner.js';
import StatsGutter from './utils/stats-gutter.js';
import StatusView from './utils/views/status-view.jsx';

class PProfile {

    constructor({config, statsGutter}) {
        this.subscriptions = null;
        this.showingLauncher = false;
        this.config = config;
        this.statsGutter = statsGutter;
    }

    getBufferFile() {
        const tab = atom.workspace.getActiveTextEditor();
        return tab.buffer.file;
    }

    validate(file) {
        if (!file) {
            return {
                valid: false,
                reason: 'Please save the buffer to run a profile.'
            }
        }
        if (path.extname(file.path) !== '.py') {
            return {
                valid: false,
                reason: 'Cannot profile non-python files.'
            }
        }
        return {
            valid: true
        }
    }

    activate(state) {
        // initialize launcher
        this.launcherContent = state.launcherContent;
        if (!state.launcherContent) {
            let cmdfile = path.resolve(__dirname, 'launcher_cmd.py');
            this.launcherContent = fs.readFileSync(cmdfile, 'utf8');
        }

        this.launcherView = new LauncherView({
            show: this.showingLauncher,
            onRun: this.run.bind(this),
            grammar: 'source.python',
            content: this.launcherContent,
            onChange: c => { this.launcherContent = c; }
        });
        atom.workspace.addBottomPanel({
            item: this.launcherView.element
        });

        // initialize status view
        this.statusView = new StatusView({
            show: false
        });
        atom.workspace.addBottomPanel({
            item: this.statusView.element
        });

        this.subscriptions = new CompositeDisposable();
        let cmds = atom.commands.add('atom-workspace', {
            'pprofile:toggle': this.toggle.bind(this)
        });
        return this.subscriptions.add(cmds);
    }

    deactivate() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.pprofileView.destroy();
    }

    serialize() {
        return {
            launcherContent: this.launcherContent
        };
    }

    getFileStats(filename, stats) {
        let basename = path.basename(filename);
        let filestats = _.find(stats, s => s.file.endsWith(basename));
        return filestats ? filestats.stats : [];
    }

    run(userInput) {
        let file = this.getBufferFile();
        let validateResult = this.validate(file);
        if (!validateResult.valid) {
            this.statusView.update({
                show: true,
                status: 'error',
                message: validateResult.reason
            });
            return;
        }

        this.launcherView.update({
            content: this.launcherContent,
            status: 'running',
            show: true
        });

        let runner = new PyLprof();
        return runner.run({
            userInput: userInput,
            context: path.dirname(file.path)
        })
        .then(({messagePProfile, stats}) => {
            // show success message
            this.statusView.update({
                show: true,
                status: 'success',
                message: messagePProfile
            });

            // render gutters
            atom.workspace.getTextEditors().forEach(editor => {
                let path = editor.buffer.file ? editor.buffer.file.path : null;
                if (path) {
                    this.statsGutter.render(
                        editor,
                        this.getFileStats(path, stats)
                    );
                }
            });
        }).catch(({message}) => {
            return this.statusView.update({
                show: true,
                status: 'error',
                message: message
            });
        }).finally(() => {
            return this.launcherView.update({
                status: 'idle'
            });
        });
    }

    toggle() {
        let willShowLauncher = !this.showingLauncher;
        if (willShowLauncher) {
            // check whether the current buffer is saved
            let file = this.getBufferFile();
            let validateResult = this.validate(file);
            if (!validateResult.valid) {
                this.statusView.update({
                    show: true,
                    status: 'error',
                    message: validateResult.reason
                });
            }
            this.launcherView.update({
                show: true,
                content: this.launcherContent
            });
            this.showingLauncher = true;
        } else {
            this.launcherView.update({
                show: false,
                content: this.launcherContent
            });
            this.statusView.update({
                show: false
            });
            atom.workspace.getTextEditors().forEach(editor => {
                this.statsGutter.render(editor, [])
            });
            this.showingLauncher = false;
        }
    }

};

let statsGutter = new StatsGutter({
    fields: [
        {
            name: 'Hits',
            get: d => d[0],
            format: d => `(${d})`
        }, {
            name: 'Time per hit',
            get: d => d[1],
            format: d => d.toFixed(8)
        }, {
            name: 'Total Time',
            get: d => d[2],
            format: d => d.toFixed(8)
        }
    ],
    defaults: {
        colorBy: 'Hits',
        labelBy: ['Hits', 'Total Time']
    }
});

let instance = new PProfile({
    config: Object.assign({}, statsGutter.config, PyLprof.config),
    statsGutter: statsGutter
});

export default instance;
