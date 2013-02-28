# sshconf-stream

Magic-free streaming SSH config parser/stringifier.

Given this `~/.ssh/config` file:

```
Host raspberry
  HostName 192.168.2.54
  User pi
```

You can get this output:

``` javascript
var ssh = require('sshconf-stream')
  , fs = require('fs')

fs.createReadStream('/home/hughsk/.ssh/config', 'utf8')
  .pipe(ssh.createParseStream())
  .on('data', function(host) {
    console.log(host['Host'])         // ['raspberry']
    console.log(host['HostName'])     // ['192.168.2.54']
    console.log(host['User'])         // ['pi']
    console.log(host['LocalForward']) // undefined
  })
```
