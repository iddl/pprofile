fs = require 'fs'
_ = require 'underscore-plus'
StatusView = require './views/status-view'

class StatusViewer

  @className = 'status-panel'

  constructor: ->

  initialize: ->

  destroy: ->
    if @view
      @view.destroy()

  render: (props) ->
    if @view
      @view.destroy()

    @view = new StatusView(props)
    atom.workspace.addBottomPanel({
      item: @view,
      className : @className
    })

  hide: ->
    if @view
      @view.hide()

  show: ->
    if @view
      @view.show()

module.exports = StatusViewer
