fs = require('fs')

class Runner
  constructor: (@type)->

class PyLprof extends Runner

  constructor: ->
    super("Guitar")

  execute: ->


module.exports = {
    pylprof : PyLprof
}
