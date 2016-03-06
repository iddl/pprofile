{View} = require 'space-pen'
{TextEditorView} = require 'atom-space-pen-views'

module.exports =
class LauncherView extends View

  @content: ->
    @div class: 'pprofile-launcher', =>
      @section class : 'input-block', =>
        @div class : 'input-block-item input-block-item--flex editor-container', =>
          @subview 'editor', new TextEditorView
        @div class : 'input-block-item', =>
          @div class : 'btn-group btn-group-run', =>
            @button class : 'btn', click: 'onRunButtonClick', =>
              @span 'Run', class : 'text'
              @div outlet: "loader"

  initialize: (params) ->
    @onRunCommand = params.onRunCommand

  onRunButtonClick: (event, element) ->
    @onRunCommand(@editor.getModel().getText())

  # FIXME make this become render
  props: (props) ->
    running = props.status == 'running'
    @loader.toggleClass 'loader', running

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    return @content
