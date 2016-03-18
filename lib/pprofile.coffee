fs = require 'fs'
_ = require 'underscore-plus'
path = require('path')
LauncherView = require './views/launcher-view'
StatsViewer = require './stats-viewer'
StatusViewer = require './status-viewer'
PyLprof = require './pylprof/runner'

{CompositeDisposable} = require 'atom'

coreConfig = {}

pprofile =

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
    @subscriptions.add atom.commands.add 'atom-workspace', 'pprofile:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @pprofileView.destroy()

  serialize: ->
    pprofileViewState: @pprofileView.serialize()

  # not optimal, it's basically going to match
  # the basename, got to find a better way to do this
  getFileStats: (filename, stats) ->
    basename = path.basename filename
    filestats = _.find stats, (s) -> return s.file.endsWith basename
    return if filestats then filestats.stats else null

  run: (cmd) ->
    self = this
    editor = atom.workspace.getActivePaneItem()
    filename = editor.buffer.file.path
    @launcherview.props({status : 'running'})
    runner = new PyLprof()
    stre = runner.run(cmd)
    .then (data) ->
      self.statusViewer.show()
      self.statusViewer.render(status : 'success', message : data.message)
      self.statsViewer.render editor, self.getFileStats(filename, data.stats)
    .catch (data) ->
      self.statusViewer.render({status : 'error', message : data.message})
    .finally () ->
      self.launcherview.props({status : 'idle'})

  toggle: ->
    editor = atom.workspace.getActivePaneItem()
    if @launcherview.isVisible()
      @launcherview.hide()
      @statsViewer.clear(editor)
    else
      @launcherview.show()
      @statusViewer.hide()

module.exports = pprofile
