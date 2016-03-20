
var StatsViewer;
var _;
var extent;
var scaleLinear;

_ = require('underscore-plus');

scaleLinear = require('d3-scale').scaleLinear;

extent = require('d3-array').extent;

StatsViewer = (function() {
    var editor;

    editor = null;

    function StatsViewer(cfg) {
        var fieldNames;
        fieldNames = _.pluck(cfg.fields, 'name');
        this.fields = cfg.fields;
        this.config = {
            appearance: {
                title: 'Statistics appearance',
                type: 'object',
                properties: {
                    colorBy: {
                        title: 'Color line markers using',
                        type: 'string',
                        "enum": fieldNames,
                        "default": cfg.defaults.colorBy
                    },
                    labelBy: {
                        title: 'Stats to show per line',
                        type: 'array',
                        description: "Available fields: " + (fieldNames.join(', ')),
                        "default": cfg.defaults.labelBy,
                        items: {
                            type: 'string',
                            "enum": fieldNames
                        }
                    }
                }
            }
        };
    }

    StatsViewer.prototype.getField = function(name) {
        return _.findWhere(this.fields, {
            name: name
        });
    };

    StatsViewer.prototype.labelFormatter = function() {
        var fields;
        var self;
        self = this;
        fields = atom.config.get('PProfile.appearance.labelBy');
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
    };

    StatsViewer.prototype.createMarkerNode = function(text, opts) {
        var border;
        var item;
        var textContainer;
        item = document.createElement('div');
        item.className = 'line-stats';
        border = document.createElement('span');
        border.className = 'border';
        border.style['border-left-color'] = opts.color || 'white';
        textContainer = document.createElement('span');
        textContainer.innerHTML = text;
        item.appendChild(border);
        item.appendChild(textContainer);
        return item;
    };

    StatsViewer.prototype.addMarker = function(editor, lines, text, opts) {
        var item;
        var marker;
        opts = opts || {};
        marker = editor.markBufferRange(lines);
        marker.emitter.on('pprofile:reload', function() {
            return marker.destroy();
        });
        marker.emitter.on('pprofile:destroy', function() {
            return marker.destroy();
        });
        item = this.createMarkerNode(text, opts);
        return editor.decorateMarker(marker, {
            type: 'gutter',
            gutterName: 'pprofile',
            "class": 'profile-gutter',
            item: item
        });
    };

    StatsViewer.prototype.renderWidthMarker = function(widestText) {
        var gutterDom;
        var markerClass;
        var widthMarker;
        markerClass = 'line-stats-width';
        gutterDom = atom.views.getView(this.gutter);
        widthMarker = _.first(gutterDom.getElementsByClassName(markerClass));
        if (!widthMarker) {
            widthMarker = document.createElement('div');
            widthMarker.className = markerClass;
            gutterDom.appendChild(widthMarker);
        }
        widthMarker.innerHTML = '';
        return widthMarker.appendChild(this.createMarkerNode(widestText, {}));
    };

    StatsViewer.prototype.addGutter = function(editor) {
        this.gutter = _.findWhere(editor.getGutters(), {
            name: 'pprofile'
        });
        if (!this.gutter) {
            return this.gutter = editor.addGutter({
                'name': 'pprofile',
                'priority': 100
            });
        }
    };

    StatsViewer.prototype.getColorScale = function(stats, field) {
        var domain;
        var ext;
        var range;
        var timings;
        range = ['#17ca65', '#FFF200', '#FF0101'];
        timings = _.pluck(stats, 'timing');
        ext = extent(timings, field.get);
        domain = [ext[0], ext[0] + (ext[1] - ext[0]) / 2, ext[1]];
        return scaleLinear().domain(domain).range(range);
    };

    StatsViewer.prototype.addMarkers = function(editor, stats) {
        var colorField;
        var colorScale;
        var formatter;
        var self;
        var widestText;
        stats = stats || {};
        self = this;
        colorField = this.getField(atom.config.get('PProfile.appearance.colorBy'));
        colorScale = this.getColorScale(stats, colorField);
        formatter = this.labelFormatter();
        widestText = '';
        _.each(stats, function(s) {
            var opts;
            var text;
            text = formatter(s);
            opts = {
                color: colorScale(colorField.get(s.timing))
            };
            self.addMarker(editor, [[s.line, 0], [s.line, Infinity]], text, opts);
            if (text.length > widestText.length) {
                return widestText = text;
            }
        });
        return {
            widestText: widestText
        };
    };

    StatsViewer.prototype.render = function(editor, stats) {
        var markerStats;
        var self;
        self = this;
        self.addGutter(editor);
        editor.getMarkers().forEach(function(marker) {
            return marker.emitter.emit('pprofile:reload');
        });
        markerStats = self.addMarkers(editor, stats);
        return this.renderWidthMarker(markerStats.widestText);
    };

    StatsViewer.prototype.clear = function(editor) {
        var gutter;
        editor.getMarkers().forEach(function(marker) {
            return marker.emitter.emit('pprofile:destroy');
        });
        gutter = _.findWhere(editor.getGutters(), {
            name: 'pprofile'
        });
        if (gutter) {
            return gutter.destroy();
        }
    };

    return StatsViewer;

})();

module.exports = StatsViewer;
