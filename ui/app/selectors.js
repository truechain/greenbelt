const abi = require('human-standard-token-abi')
import {
  transactionsSelector,
} from './selectors/transactions'
const {
  multiplyCurrencies,
} = require('./conversion-util')

const selectors = {
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedAccount,
  getSelectedToken,
  getSelectedTokenExchangeRate,
  getSelectedTokenAssetImage,
  getAssetImages,
  getTokenExchangeRate,
  conversionRateSelector,
  transactionsSelector,
  accountsWithSendEtherInfoSelector,
  getCurrentAccountWithSendEtherInfo,
  getGasIsLoading,
  getForceGasMin,
  getAddressBook,
  getSendFrom,
  getCurrentCurrency,
  getNativeCurrency,
  getSendAmount,
  getSelectedTokenToFiatRate,
  getSelectedTokenContract,
  getSendMaxModeState,
  getCurrentViewContext,
  getTotalUnapprovedCount,
  preferencesSelector,
  getGreenBeltAccounts,
  getCurrentEthBalance,
  getNetworkIdentifier,
  isBalanceCached,
  getAdvancedInlineGasShown,
}

module.exports = selectors

function getNetworkIdentifier (state) {
  const { greenbelt: { provider: { type, nickname, rpcTarget } } } = state

  return nickname || rpcTarget || type
}

function getSelectedAddress (state) {
  const selectedAddress = state.greenbelt.selectedAddress || Object.keys(getGreenBeltAccounts(state))[0]

  return selectedAddress
}

function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.greenbelt.identities

  return identities[selectedAddress]
}

function getGreenBeltAccounts (state) {
  const currentAccounts = state.greenbelt.accounts
  const cachedBalances = state.greenbelt.cachedBalances[state.greenbelt.network]
  const selectedAccounts = {}

  Object.keys(currentAccounts).forEach(accountID => {
    const account = currentAccounts[accountID]
    if (account && account.balance === null || account.balance === undefined) {
      selectedAccounts[accountID] = {
        ...account,
        balance: cachedBalances && cachedBalances[accountID],
      }
    } else {
      selectedAccounts[accountID] = account
    }
  })
  return selectedAccounts
}

function isBalanceCached (state) {
  const selectedAccountBalance = state.greenbelt.accounts[getSelectedAddress(state)].balance
  const cachedBalance = getSelectedAccountCachedBalance(state)

  return Boolean(!selectedAccountBalance && cachedBalance)
}

function getSelectedAccountCachedBalance (state) {
  const cachedBalances = state.greenbelt.cachedBalances[state.greenbelt.network]
  const selectedAddress = getSelectedAddress(state)

  return cachedBalances && cachedBalances[selectedAddress]
}

function getSelectedAccount (state) {
  const accounts = getGreenBeltAccounts(state)
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
}

function getSelectedToken (state) {
  const tokens = state.greenbelt.tokens || []
  const selectedTokenAddress = state.greenbelt.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]
  const sendToken = state.greenbelt.send.token

  return selectedToken || sendToken || null
}

function getSelectedTokenExchangeRate (state) {
  const contractExchangeRates = state.greenbelt.contractExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { address } = selectedToken
  return contractExchangeRates[address] || 0
}

function getSelectedTokenAssetImage (state) {
  const assetImages = state.greenbelt.assetImages || {}
  const selectedToken = getSelectedToken(state) || {}
  const { address } = selectedToken
  return assetImages[address]
}

function getAssetImages (state) {
  const assetImages = state.greenbelt.assetImages || {}
  return assetImages
}

function getTokenExchangeRate (state, address) {
  const contractExchangeRates = state.greenbelt.contractExchangeRates
  return contractExchangeRates[address] || 0
}

function conversionRateSelector (state) {
  return state.greenbelt.conversionRate
}

function getAddressBook (state) {
  return state.greenbelt.addressBook
}

function accountsWithSendEtherInfoSelector (state) {
  const accounts = getGreenBeltAccounts(state)
  const { identities } = state.greenbelt

  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  return accountsWithSendEtherInfo
}

function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return accounts.find(({ address }) => address === currentAddress)
}

function getCurrentEthBalance (state) {
  return getCurrentAccountWithSendEtherInfo(state).balance
}

function getGasIsLoading (state) {
  return state.appState.gasIsLoading
}

function getForceGasMin (state) {
  return state.greenbelt.send.forceGasMin
}

function getSendFrom (state) {
  return state.greenbelt.send.from
}

function getSendAmount (state) {
  return state.greenbelt.send.amount
}

function getSendMaxModeState (state) {
  return state.greenbelt.send.maxModeOn
}

function getCurrentCurrency (state) {
  return state.greenbelt.currentCurrency
}

function getNativeCurrency (state) {
  return state.greenbelt.nativeCurrency
}

function getSelectedTokenToFiatRate (state) {
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = conversionRateSelector(state)

  const tokenToFiatRate = multiplyCurrencies(
    conversionRate,
    selectedTokenExchangeRate,
    { toNumericBase: 'dec' }
  )

  return tokenToFiatRate
}

function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

function getCurrentViewContext (state) {
  const { currentView = {} } = state.appState
  return currentView.context
}

function getTotalUnapprovedCount ({ greenbelt }) {
  const {
    unapprovedTxs = {},
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = greenbelt

  return Object.keys(unapprovedTxs).length + unapprovedMsgCount + unapprovedPersonalMsgCount +
    unapprovedTypedMessagesCount
}

function preferencesSelector ({ greenbelt }) {
  return greenbelt.preferences
}

function getAdvancedInlineGasShown (state) {
  return Boolean(state.greenbelt.featureFlags.advancedInlineGas)
}
