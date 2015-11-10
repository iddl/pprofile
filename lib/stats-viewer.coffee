_ = require 'underscore-plus'

class StatsViewer
  editor = null

  constructor: () ->

  addMarker: (editor, lines, text, opts) ->
    opts = opts || {}
    marker = editor.markBufferRange lines

    marker.emitter.on 'cprofile:reload', ->
      marker.destroy()

    marker.emitter.on 'cprofile:destroy', ->
      marker.destroy()

    cc = ['good', 'warn', 'bad']
    opts.className = cc[Math.floor(Math.random() * (3))]

    item = document.createElement 'div'
    item.className = 'line-stats ' + (opts.className || '')
    item.innerHTML = text

    editor.decorateMarker marker, {type: 'gutter', gutterName: 'cprofile', class: 'profile-gutter', item: item}

  addGutter: (editor) ->
    gutter = _.findWhere editor.getGutters(), {name : 'cprofile'}
    if !gutter
      gutter = editor.addGutter {'name' : 'cprofile', 'priority' : 100, 'style'}

    return gutter

  addMarkers: (editor, stats) ->
    stats = stats || {}
    self = this
    _.each stats, (values, line) ->
      lineNumber = (parseInt line,10) - 1
      lineStats = _.first values
      text = parseFloat(lineStats.timing[2].toFixed(8))
      self.addMarker editor, [[lineNumber, 0], [lineNumber, Infinity]], text

  render: (editor, stats) ->
    self = this
    self.addGutter editor
    editor.getMarkers().forEach (marker) ->
      marker.emitter.emit 'cprofile:reload'
    self.addMarkers editor, stats

  clear: (editor) ->
    editor.getMarkers().forEach (marker) ->
      marker.emitter.emit 'cprofile:destroy'
    gutter = _.findWhere editor.getGutters(), {name : 'cprofile'}
    if gutter
      gutter.destroy()

module.exports = StatsViewer
