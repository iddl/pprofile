"use babel";

// 3p
import _ from 'underscore-plus';
import { CompositeDisposable } from "atom";
import fs from 'fs';
import path from 'path';

// project
import LauncherView from './utils/views/launcher-view.jsx';
import PyLprof from './pylprof/runner.js';
import StatsViewer from './utils/stats-viewer.js';
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

let pprofile = {
    subscriptions: null,
    showLauncher: false,
    config: _.extend({}, statsViewer.config, PyLprof.config),
    activate: function(state) {
        this.launcherView = new LauncherView({
            show: this.showLauncher,
            onRun: this.run.bind(this),
            grammar: 'source.python'
        });
        atom.workspace.addBottomPanel({
            item: this.launcherView.element
        });
        this.statusView = new StatusView({
            show: false
        });
        atom.workspace.addBottomPanel({
            item: this.statusView.element
        });
        this.subscriptions = new CompositeDisposable;
        return this.subscriptions.add(atom.commands.add('atom-workspace', {
            'pprofile:toggle': (function(_this) {
                return function() {
                    return _this.toggle();
                };
            })(this)
        }));
    },
    deactivate: function() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        return this.pprofileView.destroy();
    },
    serialize: function() {
        return {
            pprofileViewState: this.pprofileView.serialize()
        };
    },
    getFileStats: function(filename, stats) {
        var basename;
        var filestats;
        basename = path.basename(filename);
        filestats = _.find(stats, function(s) {
            return s.file.endsWith(basename);
        });
        if (filestats) {
            return filestats.stats;
        } else {
            return null;
        }
    },
    run: function(cmd) {
        var editor;
        var filename;
        var runner;
        var self;
        var stre;
        self = this;
        editor = atom.workspace.getActivePaneItem();
        filename = editor.buffer.file.path;
        this.launcherView.update({
            status: 'running',
            show: true
        });
        runner = new PyLprof();
        return stre = runner.run(cmd).then(function(data) {
            self.statusView.update({
                show: true,
                status: 'success',
                message: data.message
            });
            return statsViewer.render(editor, self.getFileStats(filename, data.stats));
        })["catch"](function(data) {
            return self.statusView.update({
                show: true,
                status: 'error',
                message: data.message
            });
        })["finally"](function() {
            return self.launcherView.update({
                status: 'idle'
            });
        });
    },
    toggle: function() {
        var editor;
        editor = atom.workspace.getActivePaneItem();
        this.showLauncher = !this.showLauncher;
        if (this.showLauncher) {
            this.launcherView.update({
                show: true
            });
            return this.statusView.update({
                show: false
            });
        } else {
            this.launcherView.update({
                show: false
            });
            return statsViewer.clear(editor);
        }
    }
};

module.exports = pprofile;
