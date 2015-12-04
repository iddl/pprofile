_ = require 'underscore-plus'
{linear} = require 'd3-scale'
{extent} = require 'd3-arrays'

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
    item.className = 'line-stats'

    border = document.createElement 'span'
    border.className = 'border'
    border.style['border-left-color'] = opts.color || 'white'

    textContainer = document.createElement 'span'
    textContainer.innerHTML = text

    item.appendChild(border)
    item.appendChild(textContainer)

    editor.decorateMarker marker, {type: 'gutter', gutterName: 'cprofile', class: 'profile-gutter', item: item}

  addGutter: (editor) ->
    gutter = _.findWhere editor.getGutters(), {name : 'cprofile'}
    if !gutter
      gutter = editor.addGutter {'name' : 'cprofile', 'priority' : 100, 'style'}

    return gutter

  getColorScale: (stats) ->
    range = ['#17ca65', '#FFF200', '#FF0101']
    timings = _.chain(stats).values().map(_.first).pluck('timing').value()
    ext = extent(timings, (d) -> d[2])
    domain = [ext[0], ext[0]+(ext[1]-ext[0])/2, ext[1]]
    return linear().domain(domain).range(range)

  addMarkers: (editor, stats) ->
    stats = stats || {}
    self = this
    colorScale = @getColorScale stats
    _.each stats, (values, line) ->
      lineNumber = (parseInt line,10) - 1
      lineStats = _.first values
      nCalls = lineStats.timing[0]
      totalTime = parseFloat(lineStats.timing[2].toFixed(8))
      text = '(' + nCalls + ') ' + totalTime
      opts = color : colorScale(totalTime)
      self.addMarker editor, [[lineNumber, 0], [lineNumber, Infinity]], text, opts

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
