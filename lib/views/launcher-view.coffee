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
            @button 'Profile', { class : 'btn', click: 'onRunButtonClick'}

  initialize: (params) ->
    @onRunCommand = params.onRunCommand

  onRunButtonClick: (event, element) ->
    @onRunCommand(@editor.getModel().getText())

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    return @content
