global.window = global

const SwGlobalListener = require('sw-stream/lib/sw-global-listener.js')
const connectionListener = new SwGlobalListener(global)
const setupMultiplex = require('../../app/scripts/lib/stream-utils.js').setupMultiplex

const DbController = require('idb-global')

const SwPlatform = require('../../app/scripts/platforms/sw')
const GreenbeltController = require('../../app/scripts/greenbelt-controller')

const Migrator = require('../../app/scripts/lib/migrator/')
const migrations = require('../../app/scripts/migrations/')
const firstTimeState = require('../../app/scripts/first-time-state')

const STORAGE_KEY = 'greenbelt-config'
const GREENBELT_DEBUG = process.env.GREENBELT_DEBUG
global.greenbeltPopupIsOpen = false

const log = require('loglevel')
global.log = log
log.setDefaultLevel(GREENBELT_DEBUG ? 'debug' : 'warn')

global.addEventListener('install', function (event) {
  event.waitUntil(global.skipWaiting())
})
global.addEventListener('activate', function (event) {
  event.waitUntil(global.clients.claim())
})

log.debug('inside:open')

// state persistence
const dbController = new DbController({
  key: STORAGE_KEY,
})

start().catch(log.error)

async function start () {
  log.debug('GreenBelt initializing...')
  const initState = await loadStateFromPersistence()
  await setupController(initState)
  log.debug('GreenBelt initialization complete.')
}

//
// State and Persistence
//
async function loadStateFromPersistence () {
  // migrations
  const migrator = new Migrator({ migrations })
  const initialState = migrator.generateInitialState(firstTimeState)
  dbController.initialState = initialState
  const versionedData = await dbController.open()
  const migratedData = await migrator.migrateData(versionedData)
  await dbController.put(migratedData)
  return migratedData.data
}

async function setupController (initState, client) {

  //
  // GreenBelt Controller
  //

  const platform = new SwPlatform()

  const controller = new GreenbeltController({
    // platform specific implementation
    platform,
    // User confirmation callbacks:
    showUnconfirmedMessage: noop,
    unlockAccountMessage: noop,
    showUnapprovedTx: noop,
    // initial state
    initState,
  })
  global.greenbeltController = controller

  controller.store.subscribe(async (state) => {
    try {
      const versionedData = await versionifyData(state)
      await dbController.put(versionedData)
    } catch (e) { console.error('GREENBELT Error:', e) }
  })

  async function versionifyData (state) {
    const rawData = await dbController.get()
    return {
      data: state,
      meta: rawData.meta,
    }
  }

  //
  // connect to other contexts
  //

  connectionListener.on('remote', (portStream, messageEvent) => {
    log.debug('REMOTE CONECTION FOUND***********')
    connectRemote(portStream, messageEvent.data.context)
  })

  function connectRemote (connectionStream, context) {
    var isGreenBeltInternalProcess = (context === 'popup')
    if (isGreenBeltInternalProcess) {
      // communication with popup
      controller.setupTrustedCommunication(connectionStream, 'GreenBelt')
      global.greenbeltPopupIsOpen = true
    } else {
      // communication with page
      setupUntrustedCommunication(connectionStream, context)
    }
  }

  function setupUntrustedCommunication (connectionStream, originDomain) {
    // setup multiplexing
    var mx = setupMultiplex(connectionStream)
    // connect features
    controller.setupProviderConnection(mx.createStream('provider'), originDomain)
    controller.setupPublicConfig(mx.createStream('publicConfig'))
  }
}
// // this will be useful later but commented out for linting for now (liiiinting)
// function sendMessageToAllClients (message) {
//   global.clients.matchAll().then(function (clients) {
//     clients.forEach(function (client) {
//       client.postMessage(message)
//     })
//   })
// }

function noop () {}
