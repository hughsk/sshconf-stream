var test = require('tape')
  , ssh = require('./')
  , assert = require('assert')

test('simple parsing test', function(t) {
  t.plan(9)

  var input = [
    'Host test-server'
  , 'HostName localhost:8430'
  , 'IdentityFile ~/.ssh/identity.pem'
  , 'RemoteForward 8080 example.com:8081'
  ].join('\n')

  var stream = ssh.createParseStream()

  stream.on('data', function(host) {
    t.equal(host.keywords.Host.length, 1)
    t.equal(host.keywords.HostName.length, 1)
    t.equal(host.keywords.IdentityFile.length, 1)
    t.equal(host.keywords.RemoteForward.length, 2)

    t.equal(host.keywords.Host[0], 'test-server')
    t.equal(host.keywords.HostName[0], 'localhost:8430')
    t.equal(host.keywords.IdentityFile[0], '~/.ssh/identity.pem')
    t.equal(host.keywords.RemoteForward[0], '8080')
    t.equal(host.keywords.RemoteForward[1], 'example.com:8081')
  })

  stream.end(input)
})

test('handles multiple hosts', function(t) {
  var input = [
    ''
  , 'Host test1'
  , 'HostName localhost:1111'
  , ''
  , 'Host test2'
  , 'HostName localhost:2222'
  , '  IdentityFile ~/.ssh/identity.pem'
  , 'Host test3'
  , '\tHost test4'
  , 'HostName localhost:4444'
  ].join('\n')

  var expected = [{
    type: 'host',
    start: 1,
    finish: 3,
    keywords: {
      Host: ['test1']
    , HostName: ['localhost:1111']
    }
  }, {
    type: 'host',
    start: 4,
    finish: 6,
    keywords: {
      Host: ['test2']
    , HostName: ['localhost:2222']
    , IdentityFile: ['~/.ssh/identity.pem']
    }
  }, {
    type: 'host',
    start: 7,
    finish: 7,
    keywords: {
      Host: ['test3']
    }
  }, {
    type: 'host',
    start: 8,
    finish: 9,
    keywords: {
      Host: ['test4']
    , HostName: ['localhost:4444']
    }
  }]

  var stream = ssh.createParseStream()
    , n = 0

  t.plan(expected.length)

  stream.on('data', function(host) {
    delete host.raw
    t.deepEqual(host, expected[n])
    n += 1
  })

  stream.end(input)
})

test('file "head" included in first host raw', function(t) {
  var input = [
    '# head line #'
  , 'Host one'
  , 'Host two'
  ].join('\n')

  var stream = ssh.createParseStream()

  t.plan(1)

  stream.once('data', function(host) {
    t.equal(host.raw, '# head line #\nHost one\n')
  })

  stream.end(input)
})
