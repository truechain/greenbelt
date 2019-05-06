const ObservableStore = require('obs-store')
const log = require('loglevel')

// every ten minutes
const POLLING_INTERVAL = 10 * 60 * 1000

class OriginController {

  constructor () {
    const initState = {
      trustedOriginList: [],
    }
    this.store = new ObservableStore(initState)
  }

  async updateTrustedOriginList () {
    const response = await fetch('http://api.truewallet.net/trustedOrigin')
    const parsedResponse = await response.json()
    const trustedOriginList = parsedResponse || [
      'stellar.truechain.pro',
      'dapp.truedapp.net',
      'admin.pandaq.net',
    ]
    this.store.updateState({
      trustedOriginList,
    })
    return trustedOriginList
  }

  scheduleTrustedOriginCheck () {
    if (this.conversionInterval) {
      clearInterval(this.conversionInterval)
    }
    this.updateTrustedOriginList().catch(log.warn)
    this.conversionInterval = setInterval(() => {
      this.updateTrustedOriginList().catch(log.warn)
    }, POLLING_INTERVAL)
  }
}

module.exports = OriginController
