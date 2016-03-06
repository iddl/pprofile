{View} = require 'space-pen'
{TextEditorView} = require 'atom-space-pen-views'

module.exports =
class StatusView extends View
  @content: (params) ->

    success = params.status == 'success'
    icon = if success then 'icon-check' else 'icon-alert'
    title = if success then 'Line profiler - Success ' else 'Line profiler - Error '

    @div class: 'profile-status', =>
      @div class: 'panel-heading padded heading header-view', =>
        @span class: 'heading-title', title
        @span class: icon
        @span { class: 'heading-close icon-remove-close pull-right', click : 'destroy' }
      if params.message
        @div class: 'tool-panel panel panel-bottom padding script-view native-key-bindings', =>
          @div class: 'panel-body padded output', =>
            @pre class: 'line stdout', params.message.toString()

  initialize: (params) ->
    @params = params

  serialize: ->

  destroy: ->
    @element.remove()

  getElement: ->
    return @content
