{View} = require 'space-pen'
{TextEditorView} = require 'atom-space-pen-views'

module.exports =
class LauncherView extends View
  @content: ->
    @div class: 'cprofile-launcher', =>
      @section class : 'input-block', =>
        @div class : 'input-block-item input-block-item--flex editor-container', =>
          @subview 'answer', new TextEditorView(mini: true)
        @div class : 'input-block-item', =>
          @div class : 'btn-group btn-group-run', =>
            @button class : 'btn', 'hello'

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    return @content
