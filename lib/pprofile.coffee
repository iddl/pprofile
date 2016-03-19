fs = require 'fs'
_ = require 'underscore-plus'
path = require('path')
LauncherView = require './views/launcher-view'
StatsViewer = require './utils/stats-viewer'
StatusViewer = require './utils/status-viewer'
PyLprof = require './pylprof/runner'

{CompositeDisposable} = require 'atom'

statsViewer = new StatsViewer({
    fields : [
        {
            name : 'Hits',
            get : (d) -> return d[0],
            format : _.identity
        },
        {
            name : 'Time per hit',
            get : (d) -> return d[1],
            format : _.identity
        },
        {
            name : 'Total Time',
            get : (d) -> return d[2],
            format : _.identity
        }
    ],
    defaults : {
        color : 'Hits',
        label : ['Hits', 'Total Time']
    }
})

pprofile =

  subscriptions : null
  statusViewer : new StatusViewer()

  config : _.extend {}, statsViewer.config, PyLprof.config

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
      statsViewer.render editor, self.getFileStats(filename, data.stats)
    .catch (data) ->
      self.statusViewer.render({status : 'error', message : data.message})
    .finally () ->
      self.launcherview.props({status : 'idle'})

  toggle: ->
    editor = atom.workspace.getActivePaneItem()
    if @launcherview.isVisible()
      @launcherview.hide()
      statsViewer.clear(editor)
    else
      @launcherview.show()
      @statusViewer.hide()

module.exports = pprofile
