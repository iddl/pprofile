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
import formatTime from './utils/format-time.js';

class PProfile {
    constructor({ config, statsGutter }) {
        this.subscriptions = null;
        this.showingLauncher = false;
        this.config = config;
        this.statsGutter = statsGutter;
        // used to render previous statistics
        // whenever new editors are opened
        this.lastReceivedStats = null;
    }

    getBufferFile() {
        const tab = atom.workspace.getActiveTextEditor();
        return tab ? tab.buffer.file : null;
    }

    validate(file) {
        if (!file) {
            return {
                valid: false,
                reason: 'Please save the buffer to run a profile.'
            };
        }
        if (path.extname(file.path) !== '.py') {
            return {
                valid: false,
                reason: 'Cannot profile non-python files.'
            };
        }
        return {
            valid: true
        };
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
            onChange: c => {
                this.launcherContent = c;
            }
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

        // callaback to show results when opening new files
        atom.workspace.observeTextEditors(editor => {
            let stats = this.lastReceivedStats;
            if (stats) {
                this.renderStatsInEditor(editor, stats);
            }
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

    renderStatsInEditor(editor, stats) {
        let path = editor.buffer.file ? editor.buffer.file.path : null;
        if (path) {
            this.statsGutter.render(editor, this.getFileStats(path, stats));
        }
    }

    run(userInput) {
        let file = this.getBufferFile();
        let validateResult = this.validate(file);
        if (!validateResult.valid) {
            atom.notifications.addWarning(validateResult.reason);
            return;
        }

        this.launcherView.update({
            content: this.launcherContent,
            status: 'running',
            show: true
        });

        let runner = new PyLprof();
        return runner
            .run({
                userInput: userInput,
                context: path.dirname(file.path)
            })
            .then(({ messagePProfile, stats }) => {
                this.lastReceivedStats = stats;

                // show success message
                this.statusView.update({
                    show: true,
                    status: 'success',
                    message: messagePProfile
                });

                // render gutters
                atom.workspace.getTextEditors().forEach(editor => {
                    this.renderStatsInEditor(editor, stats);
                });
            })
            .catch(error => {
                this.lastReceivedStats = null;
                if (error.style === 'notification') {
                    // possible explanations for most common errors
                    // eg. line profiler not installed
                    // are printed as a notification
                    atom.notifications.addWarning(error.message);
                } else if (error.style === 'output') {
                    // stack traces and errors that were not recognized
                    // are printed in the profiler console
                    return this.statusView.update({
                        show: true,
                        status: 'error',
                        message: error.message
                    });
                }
            })
            .finally(() => {
                return this.launcherView.update({
                    status: 'idle'
                });
            });
    }

    toggle() {
        // the user is not interested in the last gathered
        // profile if they are toggling the profile bar
        this.lastReceivedStats = null;

        let shouldOpenLauncher = !this.showingLauncher;
        if (shouldOpenLauncher) {
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
                this.statsGutter.render(editor, []);
            });
            this.showingLauncher = false;
        }
    }
}

let statsGutter = new StatsGutter({
    fields: [
        {
            name: 'Hits',
            get: d => d.calls,
            format: d => `(${d})`
        },
        {
            name: 'Time per hit',
            get: d => d.totalTimeMs / d.calls,
            format: d => formatTime(d)
        },
        {
            name: 'Total Time',
            get: d => d.totalTimeMs,
            format: d => formatTime(d)
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
