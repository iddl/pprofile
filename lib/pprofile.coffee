fs = require 'fs'
_ = require 'underscore-plus'
path = require('path')
LauncherView = require './utils/views/launcher-view.jsx'
StatusView = require './utils/views/status-view.jsx'
StatsViewer = require './utils/stats-viewer'
PyLprof = require './pylprof/runner'

{CompositeDisposable} = require 'atom'

statsViewer = new StatsViewer({
    fields : [
        {
            name : 'Hits',
            get : (d) -> return d[0],
            format : (d) -> return "(#{d})"
        },
        {
            name : 'Time per hit',
            get : (d) -> return d[1],
            format : (d) -> return d.toFixed(8)
        },
        {
            name : 'Total Time',
            get : (d) -> return d[2],
            format : (d) -> return d.toFixed(8)
        }
    ],
    defaults : {
        colorBy : 'Hits',
        labelBy : ['Hits', 'Total Time']
    }
})

pprofile =

  subscriptions : null
  showLauncher : false

  config : _.extend {}, statsViewer.config, PyLprof.config

  activate: (state) ->
    @launcherView = new LauncherView(
      show : @showLauncher,
      onRun : @run.bind this
    )
    atom.workspace.addBottomPanel(
      item: @launcherView.element
    )

    @statusView = new StatusView(
      show : false
    )

    atom.workspace.addBottomPanel(
      item: @statusView.element
    )


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
    @launcherView.update({
        status : 'running',
        show : true
    })
    runner = new PyLprof()
    stre = runner.run(cmd)
    .then (data) ->
      self.statusView.update(
        show : true,
        status : 'success',
        message : data.message
      )
      statsViewer.render editor, self.getFileStats(filename, data.stats)
    .catch (data) ->
      self.statusView.update(
        show : true,
        status : 'error',
        message : data.message
      )
    .finally () ->
      self.launcherView.update status : 'idle'

  toggle: ->
    editor = atom.workspace.getActivePaneItem()
    @showLauncher = !@showLauncher
    if @showLauncher
      @launcherView.update show : true
      @statusView.update show : false
    else
      @launcherView.update show : false
      statsViewer.clear editor

module.exports = pprofile
