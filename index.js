var pipeline = require('stream-combiner')
  , through = require('through')
  , shell = require('shell-quote')
  , split = require('split')

function createParseStream() {
  var stream
    , queued = {}

  function handle(chunk) {
    if (!chunk || !Object.keys(chunk).length) return
    stream.queue(chunk)
  };

  function write(data) {
    if (!data) return !this.paused
    if (!data.match(/\S/g)) return !this.paused
    if (data.match(/^\s*?\#/g)) return !this.paused

    var args = shell.parse(data)
      , keyword = args.shift()

    if (keyword === 'Host') {
      handle(queued)
      queued = {
        keywords: { Host: args }
      }
    }

    queued.keywords[keyword] = args
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

  function write(chunk) {
    stream.queue(formatted('Host', chunk.keywords.Host))

    Object.keys(chunk.keywords).forEach(function(key) {
      if (key === 'Host') return
      stream.queue(indent + formatted(key, chunk.keywords[key]))
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
