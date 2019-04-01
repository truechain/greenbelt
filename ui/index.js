const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('./app/root')
const actions = require('./app/actions')
const configureStore = require('./app/store')
const txHelper = require('./lib/tx-helper')
const { fetchLocale } = require('./i18n-helper')
const log = require('loglevel')

module.exports = launchGreenbeltUi

log.setLevel(global.GREENBELT_DEBUG ? 'debug' : 'warn')

function launchGreenbeltUi (opts, cb) {
  var accountManager = opts.accountManager
  actions._setBackgroundConnection(accountManager)
  // check if we are unlocked first
  accountManager.getState(function (err, greenbeltState) {
    if (err) return cb(err)
    startApp(greenbeltState, accountManager, opts)
      .then((store) => {
        cb(null, store)
      })
  })
}

async function startApp (greenbeltState, accountManager, opts) {
  // parse opts
  if (!greenbeltState.featureFlags) greenbeltState.featureFlags = {}

  const currentLocaleMessages = greenbeltState.currentLocale
    ? await fetchLocale(greenbeltState.currentLocale)
    : {}
  const enLocaleMessages = await fetchLocale('en')

  const store = configureStore({

    // greenbeltState represents the cross-tab state
    greenbelt: greenbeltState,

    // appState represents the current tab's popup state
    appState: {},

    localeMessages: {
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },

    // Which blockchain we are using:
    networkVersion: opts.networkVersion,
  })

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(greenbeltState.unapprovedTxs, greenbeltState.unapprovedMsgs, greenbeltState.unapprovedPersonalMsgs, greenbeltState.unapprovedTypedMessages, greenbeltState.network)
  const numberOfUnapprivedTx = unapprovedTxsAll.length
  if (numberOfUnapprivedTx > 0) {
    store.dispatch(actions.showConfTxPage({
      id: unapprovedTxsAll[numberOfUnapprivedTx - 1].id,
    }))
  }

  accountManager.on('update', function (greenbeltState) {
    store.dispatch(actions.updateGreenbeltState(greenbeltState))
  })

  // global greenbelt api - used by tooling
  global.greenbelt = {
    updateCurrentLocale: (code) => {
      store.dispatch(actions.updateCurrentLocale(code))
    },
    setProviderType: (type) => {
      store.dispatch(actions.setProviderType(type))
    },
  }

  // start app
  render(
    h(Root, {
      // inject initial state
      store: store,
    }
  ), opts.container)

  return store
}
