var pipeline = require('stream-combiner')
  , through = require('through')
  , shell = require('shell-quote')
  , split = require('split')

function createParseStream() {
  var stream
    , queued = {}
    , lineNumber = -1
    , head = false
    , raw = ''

  function handleHost(chunk) {
    if (!head) return head = true

    if (!chunk || !Object.keys(chunk).length) return raw = ''

    chunk.raw = raw
    chunk.finish = lineNumber - 1
    stream.queue(chunk)
    raw = ''
  };

  function handleRaw(chunk) {
    raw += chunk + '\n'
    return !stream.paused
  };

  function write(data) {
    lineNumber += 1

    if (!data) return handleRaw(data)
    if (!data.match(/\S/g)) return handleRaw(data)
    if (data.match(/^\s*?\#/g)) return handleRaw(data)

    var args = shell.parse(data)
      , keyword = args.shift()

    if (keyword === 'Host') {
      handleHost(queued)
      queued = {
        type: 'host',
        start: lineNumber,
        keywords: { Host: args }
      }
    }

    raw += data + '\n'

    queued.keywords[keyword] = args
  };

  function end() {
    lineNumber += 1
    handleHost(queued)
    stream.emit('end')
    process.nextTick(function() {
      stream.emit('close')
    })
  };

  return pipeline(split('\n'), stream = through(write, end))
};

function stringifyHost(keywords, opts) {
  var opts = opts || {}
    , indent = opts.indent || '\t'
    , alwaysQuote = opts.alwaysQuote
    , buffer = ''

  function formatted(key, values) {
    values = Array.isArray(values) ? values : [values]

    return key + ' ' + values.map(function(val) {
      if (alwaysQuote || val.match(/"|\s/g)) {
        val = val.replace(/"/g, '\\"')
        val = '"' + val + '"'
      }
      return val
    }).join(' ') + '\n'
  };

  if (keywords.Host) buffer += formatted('Host', keywords.Host)

  Object.keys(keywords).forEach(function(key) {
    if (key === 'Host') return
    buffer += indent + formatted(key, keywords[key])
  })

  return buffer
};

function createStringifyStream(opts) {
  var stream
    , opts = opts || {}

  function write(chunk) {
    stream.queue(stringifyHost(chunk.keywords, opts) + '\n')
  };

  return stream = through(write)
};

var ssh = module.exports = createParseStream

ssh.createParseStream =
createParseStream

ssh.createStringifyStream =
createStringifyStream

ssh.stringify = stringifyHost
