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
        this.showLauncher = false;
        this.config = config;
        this.statsGutter = statsGutter;
    }

    activate(state) {
        // initialize launcher
        this.launcherContent = state.launcherContent;
        if (!state.launcherContent) {
            let cmdfile = path.resolve(__dirname, 'launcher_cmd.py');
            this.launcherContent = fs.readFileSync(cmdfile, 'utf8');
        }

        this.launcherView = new LauncherView({
            show: this.showLauncher,
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
        return this.subscriptions.add(atom.commands.add('atom-workspace', {
            'pprofile:toggle': (function(_this) {
                return function() {
                    return _this.toggle()
                };
            })(this)
        }));
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

    run(cmd) {
        this.launcherView.update({
            content: this.launcherContent,
            status: 'running',
            show: true
        });

        let runner = new PyLprof();
        return runner.run(cmd)
        .then(({messagePProfile, stats}) => {
            // show success message
            this.statusView.update({
                show: true,
                status: 'success',
                message: messagePProfile
            });

            // render gutters
            atom.workspace.getTextEditors().forEach(editor => {
                let filename = editor.buffer.file.path;
                this.statsGutter.render(
                    editor,
                    this.getFileStats(filename, stats)
                );
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
        this.showLauncher = !this.showLauncher;
        if (this.showLauncher) {
            this.launcherView.update({
                show: true,
                content: this.launcherContent
            });
            return this.statusView.update({
                show: false
            });
        } else {
            this.launcherView.update({
                show: false,
                content: this.launcherContent
            });
            atom.workspace.getTextEditors().forEach(editor => {
                this.statsGutter.clear(editor)
            });
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
