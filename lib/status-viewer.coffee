fs = require 'fs'
_ = require 'underscore-plus'
StatusView = require './views/status-view'

class StatusViewer

  @className = 'status-panel'

  constructor: ->

  initialize: ->

  destroy: ->
    existingPanel = _.findWhere atom.workspace.getBottomPanels(), className : @className
    if existingPanel
      existingPanel.destroy()

  render: (props) ->
    props.onDestroy = @destroy
    @view = new StatusView(props)
    atom.workspace.addBottomPanel({
      item: new StatusView(props),
      className : @className
    })

  hide: ->
    if @view
      @view.hide()

  show: ->
    if @view
      @view.show()

module.exports = StatusViewer
