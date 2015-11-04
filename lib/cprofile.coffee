CprofileView = require './cprofile-view'
_ = require 'underscore-plus'
fs = require('fs');
runners = require('./runner')

{CompositeDisposable} = require 'atom'

module.exports = Cprofile =
  cprofileView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @cprofileView = new CprofileView(state.cprofileViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @cprofileView.getElement(), visible: false)

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

  addMarker: (editor, lines, text, opts) ->
    opts = opts || {}
    marker = editor.markBufferRange lines

    marker.emitter.on 'cprofile:reload', ->
        @destroy

    cc = ['good', 'warn', 'bad']
    opts.className = cc[Math.floor(Math.random() * (3))]

    item = document.createElement 'div'
    item.className = 'line-stats ' + (opts.className || '')
    item.innerHTML = text

    editor.decorateMarker marker, {type: 'gutter', gutterName: 'cprofile', class: 'profile-gutter', item: item}

  addGutter: (editor) ->
    gutter = _.findWhere editor.getGutters(), {name : 'cprofile'}
    if !gutter
        gutter = editor.addGutter {'name' : 'cprofile', 'priority' : 100, 'style'}

    return gutter

  loadStats: (path, callback) ->
    fs.readFile path, "utf8", (err, data) ->
        callback(JSON.parse(data))

  addMarkers: (editor, stats) ->
    stats = stats || {}
    self = this
    _.each stats, (values, line) ->
        lineNumber = (parseInt line,10) - 1
        lineStats = _.first values
        text = parseFloat(lineStats.timing[2].toFixed(8))
        self.addMarker editor, [[lineNumber, 0], [lineNumber, Infinity]], text

  toggle: ->
    console.log 'Cprofile was toggled!'
    # self = this
    #
    # editor = atom.workspace.getActivePaneItem()
    # filename = editor.buffer.file.path
    #
    # @loadStats '/home/ivan/tmp/staging_profile.json', (stats) ->
    #     self.addGutter editor
    #     self.addMarkers editor, stats['/usr/local/lib/python2.7/dist-packages/dogweb/controllers/api/overview.py']


    console.log(runners)

    #
    # if @modalPanel.isVisible()
    #   @modalPanel.hide()
    # else
    #   @modalPanel.show()
