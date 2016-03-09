fs = require('fs')
Q = require('q')
spawn = require('child_process').spawn
path = require('path')
_ = require('underscore-plus')
ProfileRunner = require('../profile-runner')

class PyLprof extends ProfileRunner

  constructor: ->
    super()

  @config: {
    shellCmd:
      title: 'Shell command'
      type: 'array'
      default: ['/usr/bin/python']
      items:
        type: 'string'
  }

  cmdConfig : [
    {
      name : 'importProfiler',
      source : 'imports.py'
    }, {
      name : 'dumpStats',
      source : 'dump-stats.py'
    }
  ]

  loadProfilerCommands: (cmdConfig) ->
    commands = {}
    cmdConfig.forEach (cmd) ->
      commands[cmd.name] = fs.readFileSync(path.resolve(__dirname,cmd.source), 'utf8')

    return commands

  profile: (cmd) ->
    deferred = Q.defer()

    commands = @loadProfilerCommands(@cmdConfig)

    shellCmd = atom.config.get('PProfile.shellCmd')
    exec = _.first shellCmd
    args = _.rest shellCmd
    child = spawn exec, args

    cmd = [
        commands.importProfiler,
        cmd,
        commands.dumpStats
    ].join('\n\n')

    content = ''
    stderr = ''

    child.stdin.write cmd

    child.stderr.on 'data', (data) ->
      stderr += data.toString()

    child.stdout.on 'data', (data) ->
      # inefficient but will do for now
      content += data.toString()

    child.on 'exit', (code) =>
      try
        m = (content.match '@@@STATSDUMPSTART@@@(.*)@@@STATSDUMPEND@@@')[1]
        m = m.replace('/home/vagrant/workspace', '/home/ivan/local/vm')
        stats = JSON.parse(m)
        deferred.resolve({stats : stats, message : stderr})
      catch error
        deferred.reject({message : stderr})

    return deferred.promise

  run: (cmd) ->
    deferred = Q.defer()
    return @profile(cmd)

module.exports = PyLprof
