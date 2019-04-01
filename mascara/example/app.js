const EthQuery = require('ethjs-query')

window.addEventListener('load', loadProvider)
window.addEventListener('message', console.warn)

async function loadProvider () {
  const ethereumProvider = window.greenbelt.createDefaultProvider({ host: 'http://localhost:9001' })
  const ethQuery = new EthQuery(ethereumProvider)
  const accounts = await ethQuery.accounts()
   window.GREENBELT_ACCOUNT = accounts[0] || 'locked'
  logToDom(accounts.length ? accounts[0] : 'LOCKED or undefined', 'account')
  setupButtons(ethQuery)
}


function logToDom (message, context) {
  document.getElementById(context).innerText = message
  console.log(message)
}

function setupButtons (ethQuery) {
  const accountButton = document.getElementById('action-button-1')
  accountButton.addEventListener('click', async () => {
    const accounts = await ethQuery.accounts()
    window.GREENBELT_ACCOUNT = accounts[0] || 'locked'
    logToDom(accounts.length ? accounts[0] : 'LOCKED or undefined', 'account')
  })
  const txButton = document.getElementById('action-button-2')
  txButton.addEventListener('click', async () => {
    if (!window.GREENBELT_ACCOUNT || window.GREENBELT_ACCOUNT === 'locked') return
    const txHash = await ethQuery.sendTransaction({
      from: window.GREENBELT_ACCOUNT,
      to: window.GREENBELT_ACCOUNT,
      data: '',
    })
    logToDom(txHash, 'cb-value')
  })
}
