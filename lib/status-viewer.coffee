fs = require 'fs'
_ = require 'underscore-plus'
StatusView = require './status-view'

{CompositeDisposable} = require 'atom'

class StatusViewer

  @className = 'status-panel'

  constructor: ->

  initialize: ->

  destroy: ->
    existingPanel = _.findWhere atom.workspace.getBottomPanels(), className : @className
    if existingPanel
      existingPanel.destroy()

  render: (props) ->
    @destroy()
    props.onDestroy = @destroy
    atom.workspace.addBottomPanel({
      item: new StatusView(props), 
      className : @className
    })

module.exports = StatusViewer
