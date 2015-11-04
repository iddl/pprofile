fs = require('fs')

class Runner
  constructor: (@type)->

class PyLprof extends Runner

  constructor: ->
    super("Guitar")

  run: ->
    return fs.createReadStream('/home/ivan/tmp/staging_profile.json')


module.exports = {
    pylprof : PyLprof
}
