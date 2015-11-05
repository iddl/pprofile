fs = require('fs')
Q = require('q')

class Runner
  constructor: (@type)->

class PyLprof extends Runner

  constructor: ->
    super("Guitar")

  run: ->
    deferred = Q.defer()

    stream = fs.createReadStream('/home/ivan/tmp/staging_profile.json')

    content = ''
    stream.on 'data', (buf) ->
      content += buf.toString()

    stream.on 'end', (buf) ->
      deferred.resolve(JSON.parse(content))

    return deferred.promise


module.exports = {
    pylprof : PyLprof
}
