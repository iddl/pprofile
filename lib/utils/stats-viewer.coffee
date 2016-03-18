_ = require 'underscore-plus'
{scaleLinear} = require 'd3-scale'
{extent} = require 'd3-array'

class StatsViewer
  editor = null

  constructor: () ->

  createMarkerNode: (text, opts) ->
    item = document.createElement 'div'
    item.className = 'line-stats'

    border = document.createElement 'span'
    border.className = 'border'
    border.style['border-left-color'] = opts.color || 'white'

    textContainer = document.createElement 'span'
    textContainer.innerHTML = text

    item.appendChild(border)
    item.appendChild(textContainer)

    return item

  addMarker: (editor, lines, text, opts) ->
    opts = opts || {}
    marker = editor.markBufferRange lines

    marker.emitter.on 'pprofile:reload', ->
      marker.destroy()

    marker.emitter.on 'pprofile:destroy', ->
      marker.destroy()

    item = @createMarkerNode text, opts

    editor.decorateMarker marker, {
      type: 'gutter',
      gutterName: 'pprofile',
      class: 'profile-gutter',
      item: item
    }

  # used to apply a width to the gutter
  # https://github.com/atom/atom/blob/v1.5.4/src/line-number-gutter-component.coffee#L74-L79
  renderWidthMarker: (widestText) ->
    markerClass = 'line-stats-width'
    gutterDom = atom.views.getView(@gutter)
    widthMarker = _.first gutterDom.getElementsByClassName(markerClass)

    if !widthMarker
      widthMarker = document.createElement 'div'
      widthMarker.className = markerClass
      gutterDom.appendChild widthMarker

    widthMarker.innerHTML = ''
    widthMarker.appendChild(@createMarkerNode widestText, {})

  addGutter: (editor) ->
    @gutter = _.findWhere editor.getGutters(), {name : 'pprofile'}
    if !@gutter
      @gutter = editor.addGutter {
        'name' : 'pprofile',
        'priority' : 100
      }

  getColorScale: (stats) ->
    range = ['#17ca65', '#FFF200', '#FF0101']
    timings = _.pluck(stats, 'timing')
    ext = extent(timings, (d) -> d[2])
    domain = [ext[0], ext[0]+(ext[1]-ext[0])/2, ext[1]]
    return scaleLinear().domain(domain).range(range)

  addMarkers: (editor, stats) ->
    stats = stats || {}
    self = this
    colorScale = @getColorScale stats
    widestText = ''
    _.each stats, (s) ->
      nCalls = s.timing[0]
      totalTime = parseFloat(s.timing[2].toFixed(8))
      text = "(#{nCalls}) #{totalTime}"
      opts = color : colorScale(totalTime)
      self.addMarker editor, [[s.line, 0], [s.line, Infinity]], text, opts
      if text.length > widestText.length
        widestText = text

    return {
        widestText : widestText
    }

  render: (editor, stats) ->
    self = this
    self.addGutter editor
    editor.getMarkers().forEach (marker) ->
      marker.emitter.emit 'pprofile:reload'
    markerStats = self.addMarkers editor, stats
    @renderWidthMarker markerStats.widestText

  clear: (editor) ->
    editor.getMarkers().forEach (marker) ->
      marker.emitter.emit 'pprofile:destroy'
    gutter = _.findWhere editor.getGutters(), {name : 'pprofile'}
    if gutter
      gutter.destroy()

module.exports = StatsViewer
