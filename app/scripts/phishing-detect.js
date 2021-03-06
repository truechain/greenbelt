const querystring = require('querystring')
const dnode = require('dnode')
const { EventEmitter } = require('events')
const PortStream = require('extension-port-stream')
const extension = require('extensionizer')
const {setupMultiplex} = require('./lib/stream-utils.js')
const { getEnvironmentType } = require('./lib/util')
const ExtensionPlatform = require('./platforms/extension')

document.addEventListener('DOMContentLoaded', start)

function start () {
  const windowType = getEnvironmentType(window.location.href)
  const hash = window.location.hash.substring(1)
  const suspect = querystring.parse(hash)

  document.getElementById('esdbLink').href = `https://etherscamdb.info/domain/${suspect.hostname}`

  global.platform = new ExtensionPlatform()
  global.GREENBELT_UI_TYPE = windowType

  const extensionPort = extension.runtime.connect({ name: windowType })
  const connectionStream = new PortStream(extensionPort)
  const mx = setupMultiplex(connectionStream)
  setupControllerConnection(mx.createStream('tcontroller'), (err, greenBeltController) => {
    if (err) {
      return
    }

    const continueLink = document.getElementById('unsafe-continue')
    continueLink.addEventListener('click', () => {
      greenBeltController.whitelistPhishingDomain(suspect.hostname)
      window.location.href = suspect.href
    })
  })
}

function setupControllerConnection (connectionStream, cb) {
  const eventEmitter = new EventEmitter()
  const accountManagerDnode = dnode({
    sendUpdate (state) {
      eventEmitter.emit('update', state)
    },
  })
  connectionStream.pipe(accountManagerDnode).pipe(connectionStream)
  accountManagerDnode.once('remote', (accountManager) => cb(null, accountManager))
}
