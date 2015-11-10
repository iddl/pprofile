fs = require('fs')
Q = require('q')
spawn = require('child_process').spawn
ProfileRunner = require('../profile-runner')

class PyLprof extends ProfileRunner

  constructor: ->
    super()

  create_command: (cmd, file) ->
    deferred = Q.defer()
    cmdfile = '/home/ivan/local/vm/dogweb/cmd.txt'

    fs.writeFile cmdfile, cmd, (err) ->
      deferred.resolve cmdfile

    return deferred.promise

  profile: (cmd) ->
    deferred = Q.defer()

    return @create_command(cmd,2).then (cmdfile) ->
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

  convert: (filename) ->
    deferred = Q.defer()
    content = ''
    child = spawn '/usr/bin/python', ['/home/ivan/github/cprofile/lib/pylprof/pickletojson.py', filename]
    child.stdout.on 'data', (buf) ->
      content += buf.toString()
    child.on 'exit', (buf) ->
      content = content.replace('/home/vagrant/workspace', '/home/ivan/local/vm')
      deferred.resolve JSON.parse(content)
    return deferred.promise

  run: (cmd) ->
    deferred = Q.defer()
    self = this

    return @profile(cmd).then self.convert



module.exports = {
    pylprof : PyLprof
}
