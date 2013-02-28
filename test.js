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

  var stream = ssh.parse()

  stream.on('data', function(host) {
    t.equal(host.Host.length, 1)
    t.equal(host.HostName.length, 1)
    t.equal(host.IdentityFile.length, 1)
    t.equal(host.RemoteForward.length, 2)

    t.equal(host.Host[0], 'test-server')
    t.equal(host.HostName[0], 'localhost:8430')
    t.equal(host.IdentityFile[0], '~/.ssh/identity.pem')
    t.equal(host.RemoteForward[0], '8080')
    t.equal(host.RemoteForward[1], 'example.com:8081')
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
    Host: ['test1']
  , HostName: ['localhost:1111']
  }, {
    Host: ['test2']
  , HostName: ['localhost:2222']
  , IdentityFile: ['~/.ssh/identity.pem']
  }, {
    Host: ['test3']
  }, {
    Host: ['test4']
  , HostName: ['localhost:4444']
  }]

  var stream = ssh.parse()
    , n = 0

  t.plan(expected.length)

  stream.on('data', function(host) {
    t.deepEqual(host, expected[n])
    n += 1
  })

  stream.end(input)
})
