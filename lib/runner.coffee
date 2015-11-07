fs = require('fs')
Q = require('q')
spawn = require('child_process').spawn

class Runner
  constructor: (@type)->

class PyLprof extends Runner

  constructor: ->
    super()

  create_command: (cmd, file) ->
    deferred = Q.defer()

    cmd = """
    from dd.utils.dtime import delta_string_to_seconds
    from line_profiler import LineProfiler
    lp = LineProfiler()
    lp.add_function(delta_string_to_seconds)
    lp.enable_by_count()
    delta_string_to_seconds('1s')
    lp.print_stats()
    lp.dump_stats('/home/vagrant/workspace/dogweb/stats.lprof')
    exit()
    """
    cmdfile = '/home/ivan/local/vm/dogweb/cmd.txt'

    fs.writeFile cmdfile, cmd, (err) ->
      deferred.resolve cmdfile

    return deferred.promise

  profile: ->
    deferred = Q.defer()

    return @create_command(1,2).then (cmdfile) ->
      child = spawn '/usr/bin/vagrant', ["ssh", "-c", "source ./dogweb/python/bin/activate; cd ./workspace/dogweb; paster shell development.ini < cmd.txt"], {
        cwd : '/home/ivan/local/personal-chef'
      }
      child.stderr.on 'data', (data) ->
        console.log(data.toString())
      child.stdout.on 'data', (data) ->
        console.log(data.toString())
      child.on 'exit', (code) =>
        deferred.resolve('/home/ivan/local/vm/dogweb/stats.lprof')
      return deferred.promise

  convert: (json, oldroot, newroot) ->
    json.replace(oldroot, newroot)

  convert: (filename) ->
    deferred = Q.defer()
    content = ''
    child = spawn '/usr/bin/python', ['/home/ivan/github/cprofile/lib/pickletojson.py', filename]
    child.stdout.on 'data', (buf) ->
      content += buf.toString()
    child.on 'exit', (buf) ->
      content = content.replace('/home/vagrant/workspace', '/home/ivan/local/vm')
      deferred.resolve JSON.parse(content)
    return deferred.promise

  run: ->
    deferred = Q.defer()
    self = this

    return @profile().then self.convert



module.exports = {
    pylprof : PyLprof
}
