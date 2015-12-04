fs = require 'fs'
_ = require 'underscore-plus'
LauncherView = require './views/launcher-view'
StatsViewer = require './stats-viewer'
StatusViewer = require './status-viewer'
PyLprof = require './pylprof/runner'

{CompositeDisposable} = require 'atom'

coreConfig = {}

Cprofile =

  subscriptions : null
  statsViewer : new StatsViewer()
  statusViewer : new StatusViewer()

  config : _.extend {}, coreConfig, PyLprof.config

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
    runner = new PyLprof()
    stre = runner.run(cmd)
    .then (stats) ->
      self.launcherview.hide()
      self.statusViewer.show()
      self.statusViewer.render(status : 'success')
      self.statsViewer.render editor, stats[filename]
    .catch (err) ->
      self.statusViewer.render({status : 'error', message : err})
      self.launcherview.show()

  toggle: ->
    editor = atom.workspace.getActivePaneItem()
    if @launcherview.isVisible()
      @launcherview.hide()
      @statsViewer.clear(editor)
    else
      @launcherview.show()
      @statusViewer.hide()

module.exports = Cprofile
