fs = require 'fs'

LauncherView = require './launcher-view'
StatsViewer = require './stats-viewer'
runners = require './pylprof/runner'

{CompositeDisposable} = require 'atom'

module.exports = Cprofile =
  subscriptions : null
  statsViewer : new StatsViewer()

  activate: (state) ->
    @launcherview = new LauncherView onRunCommand : @run.bind(this)
    atom.workspace.addBottomPanel(item: @launcherview)
    @launcherview.hide()

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'cprofile:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @cprofileView.destroy()

  serialize: ->
    cprofileViewState: @cprofileView.serialize()

  run: (cmd) ->
    self = this
    editor = atom.workspace.getActivePaneItem()
    filename = editor.buffer.file.path
    PyRunner = runners.pylprof
    prInstance = new PyRunner()
    stre = prInstance.run(cmd)
    .then (stats) ->
      self.launcherview.hide()
      atom.notifications.addSuccess 'Profile complete'
      self.statsViewer.render editor, stats[filename]
    .catch (err) ->
      atom.notifications.addError err
      @launcherview.show()

  toggle: ->
    editor = atom.workspace.getActivePaneItem()
    if @launcherview.isVisible()
      @launcherview.hide()
      @statsViewer.clear(editor)
    else
      @launcherview.show()
