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

  dialtone: (child) ->
    maxAttempts = 10
    curAttempt = 0
    stderr = ''
    dialtoneKey = '@@@DIALTONE@@@'
    dialtoneCmd = 'print "' + dialtoneKey + '"\n'
    deferred = Q.defer()

    dialtoneInterval = setInterval (->
      if curAttempt > maxAttempts
        clearInterval dialtoneInterval
        deferred.reject('Dialtone max attempts reached')
      else
        try
          child.stdin.write dialtoneCmd for i in [0..100]
        catch err
          clearInterval dialtoneInterval
          stderr += err.toString()
          deferred.reject(stderr)

        curAttempt += 1
    ), 1000

    child.stderr.on 'data', (err) ->
      stderr += err.toString()

    child.stdout.on 'data', (data) ->
      if data.toString().indexOf(dialtoneKey) isnt -1
        clearInterval dialtoneInterval
        deferred.resolve child

    return deferred.promise

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
    ].join('\n')

    content = ''
    stderr = ''
    @dialtone(child).then ->
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
    .catch (err) ->
      deferred.reject(err)

    return deferred.promise

  run: (cmd) ->
    deferred = Q.defer()
    return @profile(cmd)

module.exports = PyLprof
