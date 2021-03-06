const { valuesFor } = require('../../util')
const abi = require('human-standard-token-abi')
const {
  multiplyCurrencies,
} = require('../../conversion-util')
const {
  getGreenBeltAccounts,
} = require('../../selectors')
const {
  estimateGasPriceFromRecentBlocks,
  calcGasTotal,
} = require('./send.utils')
import {
  getFastPriceEstimateInHexWEI,
} from '../../selectors/custom-gas'

const selectors = {
  accountsWithSendEtherInfoSelector,
  getAddressBook,
  getAmountConversionRate,
  getBlockGasLimit,
  getConversionRate,
  getCurrentAccountWithSendEtherInfo,
  getCurrentCurrency,
  getCurrentNetwork,
  getCurrentViewContext,
  getForceGasMin,
  getNativeCurrency,
  getGasLimit,
  getGasPrice,
  getGasPriceFromRecentBlocks,
  getGasTotal,
  getPrimaryCurrency,
  getRecentBlocks,
  getSelectedAccount,
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedToken,
  getSelectedTokenContract,
  getSelectedTokenExchangeRate,
  getSelectedTokenToFiatRate,
  getSendAmount,
  getSendHexData,
  getSendHexDataFeatureFlagState,
  getSendEditingTransactionId,
  getSendErrors,
  getSendFrom,
  getSendFromBalance,
  getSendFromObject,
  getSendMaxModeState,
  getSendTo,
  getSendToAccounts,
  getSendWarnings,
  getTokenBalance,
  getTokenExchangeRate,
  getUnapprovedTxs,
  transactionsSelector,
  getQrCodeData,
}

module.exports = selectors

function accountsWithSendEtherInfoSelector (state) {
  const accounts = getGreenBeltAccounts(state)
  const { identities } = state.greenbelt

  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  return accountsWithSendEtherInfo
}

function getAddressBook (state) {
  return state.greenbelt.addressBook
}

function getAmountConversionRate (state) {
  return getSelectedToken(state)
    ? getSelectedTokenToFiatRate(state)
    : getConversionRate(state)
}

function getBlockGasLimit (state) {
  return state.greenbelt.currentBlockGasLimit
}

function getConversionRate (state) {
  return state.greenbelt.conversionRate
}

function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return accounts.find(({ address }) => address === currentAddress)
}

function getCurrentCurrency (state) {
  return state.greenbelt.currentCurrency
}

function getNativeCurrency (state) {
  return state.greenbelt.nativeCurrency
}

function getCurrentNetwork (state) {
  return state.greenbelt.network
}

function getCurrentViewContext (state) {
  const { currentView = {} } = state.appState
  return currentView.context
}

function getForceGasMin (state) {
  return state.greenbelt.send.forceGasMin
}

function getGasLimit (state) {
  return state.greenbelt.send.gasLimit || '0'
}

function getGasPrice (state) {
  return state.greenbelt.send.gasPrice || getFastPriceEstimateInHexWEI(state)
}

function getGasPriceFromRecentBlocks (state) {
  return estimateGasPriceFromRecentBlocks(state.greenbelt.recentBlocks)
}

function getGasTotal (state) {
  return calcGasTotal(getGasLimit(state), getGasPrice(state))
}

function getPrimaryCurrency (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken && selectedToken.symbol
}

function getRecentBlocks (state) {
  return state.greenbelt.recentBlocks
}

function getSelectedAccount (state) {
  const accounts = getGreenBeltAccounts(state)
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
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

function getSelectedToken (state) {
  const tokens = state.greenbelt.tokens || []
  const selectedTokenAddress = state.greenbelt.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]
  const sendToken = state.greenbelt.send.token

  return selectedToken || sendToken || null
}

function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)

  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

function getSelectedTokenExchangeRate (state) {
  const tokenExchangeRates = state.greenbelt.tokenExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { symbol = '' } = selectedToken
  const pair = `${symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates && tokenExchangeRates[pair] || {}

  return tokenExchangeRate
}

function getSelectedTokenToFiatRate (state) {
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = getConversionRate(state)

  const tokenToFiatRate = multiplyCurrencies(
    conversionRate,
    selectedTokenExchangeRate,
    { toNumericBase: 'dec' }
  )

  return tokenToFiatRate
}

function getSendAmount (state) {
  return state.greenbelt.send.amount
}

function getSendHexData (state) {
  return state.greenbelt.send.data
}

function getSendHexDataFeatureFlagState (state) {
  return state.greenbelt.featureFlags.sendHexData
}

function getSendEditingTransactionId (state) {
  return state.greenbelt.send.editingTransactionId
}

function getSendErrors (state) {
  return state.send.errors
}

function getSendFrom (state) {
  return state.greenbelt.send.from
}

function getSendFromBalance (state) {
  const from = getSendFrom(state) || getSelectedAccount(state)
  return from.balance
}

function getSendFromObject (state) {
  return getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state)
}

function getSendMaxModeState (state) {
  return state.greenbelt.send.maxModeOn
}

function getSendTo (state) {
  return state.greenbelt.send.to
}

function getSendToAccounts (state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state)
  const addressBookAccounts = getAddressBook(state)
  const allAccounts = [...fromAccounts, ...addressBookAccounts]
  // TODO: figure out exactly what the below returns and put a descriptive variable name on it
  return Object.entries(allAccounts).map(([key, account]) => account)
}

function getSendWarnings (state) {
  return state.send.warnings
}

function getTokenBalance (state) {
  return state.greenbelt.send.tokenBalance
}

function getTokenExchangeRate (state, tokenSymbol) {
  const pair = `${tokenSymbol.toLowerCase()}_eth`
  const tokenExchangeRates = state.greenbelt.tokenExchangeRates
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}

  return tokenExchangeRate
}

function getUnapprovedTxs (state) {
  return state.greenbelt.unapprovedTxs
}

function transactionsSelector (state) {
  const { network, selectedTokenAddress } = state.greenbelt
  const unapprovedMsgs = valuesFor(state.greenbelt.unapprovedMsgs)
  const shapeShiftTxList = (network === '1') ? state.greenbelt.shapeShiftTxList : undefined
  const transactions = state.greenbelt.selectedAddressTxList || []
  const txsToRender = !shapeShiftTxList ? transactions.concat(unapprovedMsgs) : transactions.concat(unapprovedMsgs, shapeShiftTxList)

  return selectedTokenAddress
    ? txsToRender
      .filter(({ txParams }) => txParams && txParams.to === selectedTokenAddress)
      .sort((a, b) => b.time - a.time)
    : txsToRender
      .sort((a, b) => b.time - a.time)
}

function getQrCodeData (state) {
  return state.appState.qrCodeData
}
