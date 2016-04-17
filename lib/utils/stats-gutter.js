'use babel';

// 3p
import _ from 'underscore-plus';
import { scaleLinear } from 'd3-scale';
import { extent } from 'd3-array';

export default class StatsViewer {

    constructor(cfg) {
        let fieldNames = _.pluck(cfg.fields, 'name');
        this.fields = cfg.fields;
        this.config = {
            appearance: {
                title: 'Statistics appearance',
                type: 'object',
                properties: {
                    colorBy: {
                        title: 'Color line markers using',
                        type: 'string',
                        'enum': fieldNames,
                        'default': cfg.defaults.colorBy
                    },
                    labelBy: {
                        title: 'Stats to show per line',
                        type: 'array',
                        description: 'Available fields: ' + (fieldNames.join(', ')),
                        'default': cfg.defaults.labelBy,
                        items: {
                            type: 'string',
                            'enum': fieldNames
                        }
                    }
                }
            }
        };
    }

    getField(name) {
        return _.findWhere(this.fields, {
            name: name
        });
    }

    labelFormatter() {
        let self = this;
        let fields = atom.config.get('PProfile.appearance.labelBy');

        fields = fields.map(function(f) {
            f = self.getField(f);
            return function(line) {
                return f.format(f.get(line));
            };
        });

        return function(line) {
            return fields.map(function(f) {
                return f(line.timing);
            }).join(' ');
        };
    }

    createMarkerNode(text, opts) {
        let item = document.createElement('div');
        item.className = 'line-stats';

        let border = document.createElement('span');
        border.className = 'border';
        border.style['border-left-color'] = opts.color || 'white';

        let textContainer = document.createElement('span');
        textContainer.innerHTML = text;

        item.appendChild(border);
        item.appendChild(textContainer);
        return item;
    }

    addMarker(editor, lines, text, opts = {}) {
        let marker = editor.markBufferRange(lines);
        marker.emitter.on('pprofile:reload', function() {
            return marker.destroy();
        });
        marker.emitter.on('pprofile:destroy', function() {
            return marker.destroy();
        });

        let item = this.createMarkerNode(text, opts);
        return editor.decorateMarker(marker, {
            type: 'gutter',
            gutterName: 'pprofile',
            'class': 'profile-gutter',
            item: item
        });
    }

    renderWidthMarker(widestText) {
        let markerClass = 'line-stats-width';
        let gutterDom = atom.views.getView(this.gutter);
        let widthMarker = _.first(gutterDom.getElementsByClassName(markerClass));

        if (!widthMarker) {
            widthMarker = document.createElement('div');
            widthMarker.className = markerClass;
            gutterDom.appendChild(widthMarker);
        }
        widthMarker.innerHTML = '';
        return widthMarker.appendChild(this.createMarkerNode(widestText, {}));
    }

    addGutter(editor) {
        this.gutter = _.findWhere(editor.getGutters(), {
            name: 'pprofile'
        });
        if (!this.gutter) {
            this.gutter = editor.addGutter({
                'name': 'pprofile',
                'priority': 100
            });
        }
    }

    getColorScale(stats, field) {
        let range = ['#17ca65', '#FFF200', '#FF0101'];
        let timings = _.pluck(stats, 'timing');
        let ext = extent(timings, field.get);
        let domain = [ext[0], ext[0] + (ext[1] - ext[0]) / 2, ext[1]];
        return scaleLinear().domain(domain).range(range);
    }

    addMarkers(editor, stats = []) {
        let self = this;
        let colorField = this.getField(atom.config.get('PProfile.appearance.colorBy'));
        let colorScale = this.getColorScale(stats, colorField);
        let formatter = this.labelFormatter();
        let widestText = '';

        stats.forEach(s => {
            let text = formatter(s);
            let opts = {
                color: colorScale(colorField.get(s.timing))
            };
            self.addMarker(editor, [[s.line, 0], [s.line, Infinity]], text, opts);
            if (text.length > widestText.length) {
                // remember widest text
                widestText = text;
                return text;
            }
        });

        return {
            widestText: widestText
        };
    }

    render(editor, stats) {
        this.addGutter(editor);
        editor.getMarkers().forEach(function(marker) {
            return marker.emitter.emit('pprofile:reload');
        });

        let markerStats = this.addMarkers(editor, stats);
        this.renderWidthMarker(markerStats.widestText);
    }

    clear(editor) {
        editor.getMarkers().forEach(function(marker) {
            return marker.emitter.emit('pprofile:destroy');
        });
        let gutter = _.findWhere(editor.getGutters(), {
            name: 'pprofile'
        });
        if (gutter) {
            gutter.destroy();
        }
    }

}
