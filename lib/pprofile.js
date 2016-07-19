'use babel';

// Code is s*** because of coffeescript -> ES6 migration

// 3p
import _ from 'underscore-plus';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import path from 'path';

// project
import LauncherView from './utils/views/launcher-view.jsx';
import PyLprof from './pylprof/runner.js';
import StatsViewer from './utils/stats-gutter.js';
import StatusView from './utils/views/status-view.jsx';

let statsViewer = new StatsViewer({
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

class PProfile {

    constructor() {
        this.subscriptions = null;
        this.showLauncher = false;
        this.config = Object.assign({}, statsViewer.config, PyLprof.config);
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
        let editor = atom.workspace.getActivePaneItem();
        let filename = editor.buffer.file.path;
        this.launcherView.update({
            content: this.launcherContent,
            status: 'running',
            show: true
        });

        let runner = new PyLprof();
        return runner.run(cmd)
        .then(data => {
            this.statusView.update({
                show: true,
                status: 'success',
                message: data.messagePProfile
            });
            return statsViewer.render(
                editor,
                this.getFileStats(filename, data.stats)
            );
        }).catch(data => {
            return this.statusView.update({
                show: true,
                status: 'error',
                message: data.message
            });
        }).finally(() => {
            return this.launcherView.update({
                status: 'idle'
            });
        });
    }

    toggle() {
        let editor = atom.workspace.getActivePaneItem();
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
            return statsViewer.clear(editor);
        }
    }

};

let instance = new PProfile();
export default instance;
