var pipeline = require('stream-combiner')
  , through = require('through')
  , shell = require('shell-quote')
  , split = require('split')

function createParseStream() {
  var stream
    , queued = {}

  function handle(host) {
    if (!host || !Object.keys(host).length) return
    stream.queue(host)
  };

  function write(data) {
    if (!data) return !this.paused
    if (!data.match(/\S/g)) return !this.paused
    if (data.match(/^\s*?\#/g)) return !this.paused

    var args = shell.parse(data)
      , keyword = args.shift()

    if (keyword === 'Host') {
      handle(queued)
      queued = { Host: args }
    }

    queued[keyword] = args
  };

  function end() {
    handle(queued)
    stream.emit('end')
    process.nextTick(function() {
      stream.emit('close')
    })
  };

  return pipeline(split('\n'), stream = through(write, end))
};

function createStringifyStream(opts) {
  var stream
    , opts = opts || {}
    , indent = opts.indent || '\t'
    , alwaysQuote = opts.alwaysQuote

  function formatted(key, values) {
    return key + ' ' + values.map(function(val) {
      if (alwaysQuote || val.match(/"|\s/g)) {
        val = val.replace(/"/g, '\\"')
        val = '"' + val + '"'
      }
      return val
    }).join(' ') + '\n'
  };

  function write(data) {
    stream.queue(formatted('Host', data.Host))

    Object.keys(data).forEach(function(key) {
      if (key === 'Host') return
      stream.queue(indent + formatted(key, data[key]))
    })

    stream.queue('\n')
  };

  return stream = through(write)
};

var ssh = module.exports = createParseStream

ssh.createParseStream =
ssh.parse =
createParseStream

ssh.createStringifyStream =
ssh.stringify =
createStringifyStream
