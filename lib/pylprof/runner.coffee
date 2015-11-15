fs = require('fs')
Q = require('q')
spawn = require('child_process').spawn
ProfileRunner = require('../profile-runner')

class PyLprof extends ProfileRunner

  constructor: ->
    super()

  commands : {
      importProfiler : """
      from line_profiler import LineProfiler
      lp = LineProfiler()
      """,
      dumpStats : """
      import json
      stats = lp.get_stats()
      unit = stats.unit
      results = {}
      for function, timings in stats.timings.iteritems():
          module, line, fname = function
          results[module] = {}
          for sample in timings:
              linenumber, ncalls, timing = sample
              if not results[module].get(linenumber):
                  results[module][linenumber] = []
              results[module][linenumber].append({
                  'name' : '',
                  'timing' : [ncalls, timing*unit, timing*unit*ncalls]
              })\n\n
      jsondump = json.dumps(results)
      print('@@@STATSDUMPSTART@@@' + jsondump + '@@@STATSDUMPEND@@@')
      exit()\n
      """
  }

  dialtone: (child) ->
    maxAttempts = 10
    curAttempt = 0
    dialtoneKey = '@@@DIALTONE@@@'
    dialtoneCmd = 'print "' + dialtoneKey + '"\n'
    deferred = Q.defer()

    dialtoneInterval = setInterval (->
      if curAttempt > maxAttempts
        clearInterval dialtoneInterval
        deferred.reject()
      else
        child.stdin.write dialtoneCmd for i in [0..100]
        curAttempt += 1
    ), 1000

    child.stderr.on 'data', ->

    child.stdout.on 'data', (data) ->
      if data.toString().indexOf(dialtoneKey) isnt -1
        clearInterval dialtoneInterval
        deferred.resolve child

    return deferred.promise

  profile: (cmd) ->
    deferred = Q.defer()

    child = spawn '/usr/bin/ssh', ["-p", "2222", "vagrant@127.0.0.1", "-i", "/home/ivan/.vagrant.d/insecure_private_key", "-t", "source ./dogweb/python/bin/activate; cd ./workspace/dogweb; paster shell development.ini"]

    cmd = [
        @commands.importProfiler,
        cmd,
        @commands.dumpStats
    ].join('\n')

    content = ''
    @dialtone(child).then ->
      child.stdin.write cmd
      child.stderr.on 'data', (data) ->
        console.log(data.toString())
      child.stdout.on 'data', (data) ->
        # inefficient but will do for now
        content += data.toString()
      child.on 'exit', (code) =>
        try
          m = (content.match '@@@STATSDUMPSTART@@@(.*)@@@STATSDUMPEND@@@')[1]
          m = m.replace('/home/vagrant/workspace', '/home/ivan/local/vm')
          stats = JSON.parse(m)
          deferred.resolve(stats)
        catch error
          deferred.reject('Error parsing statistics')

      return deferred.promise

  run: (cmd) ->
    deferred = Q.defer()
    self = this

    return @profile(cmd)



module.exports = {
    pylprof : PyLprof
}
