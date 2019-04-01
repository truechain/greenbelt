const extend = require('xtend')
const actions = require('../actions')
const MetamascaraPlatform = require('../../../app/scripts/platforms/window')
const { getEnvironmentType } = require('../../../app/scripts/lib/util')
const { ENVIRONMENT_TYPE_POPUP } = require('../../../app/scripts/lib/enums')
const { OLD_UI_NETWORK_TYPE } = require('../../../app/scripts/controllers/network/enums')

module.exports = reduceGreenbelt

function reduceGreenbelt (state, action) {
  let newState

  // clone + defaults
  var greenbeltState = extend({
    isInitialized: false,
    isUnlocked: false,
    isAccountMenuOpen: false,
    isMascara: window.platform instanceof MetamascaraPlatform,
    isPopup: getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP,
    rpcTarget: 'https://rawtestrpc.greenbelt.io/',
    identities: {},
    unapprovedTxs: {},
    noActiveNotices: true,
    nextUnreadNotice: undefined,
    frequentRpcList: [],
    addressBook: [],
    selectedTokenAddress: null,
    contractExchangeRates: {},
    tokenExchangeRates: {},
    tokens: [],
    pendingTokens: {},
    send: {
      gasLimit: null,
      gasPrice: null,
      gasTotal: null,
      tokenBalance: '0x0',
      from: '',
      to: '',
      amount: '0x0',
      memo: '',
      errors: {},
      maxModeOn: false,
      editingTransactionId: null,
      forceGasMin: null,
      toNickname: '',
    },
    coinOptions: {},
    useBlockie: false,
    featureFlags: {},
    networkEndpointType: OLD_UI_NETWORK_TYPE,
    isRevealingSeedWords: false,
    welcomeScreenSeen: false,
    currentLocale: '',
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    completedOnboarding: false,
    knownMethodData: {},
  }, state.greenbelt)

  switch (action.type) {

    case actions.SHOW_ACCOUNTS_PAGE:
      newState = extend(greenbeltState, {
        isRevealingSeedWords: false,
      })
      delete newState.seedWords
      return newState

    case actions.SHOW_NOTICE:
      return extend(greenbeltState, {
        noActiveNotices: false,
        nextUnreadNotice: action.value,
      })

    case actions.CLEAR_NOTICES:
      return extend(greenbeltState, {
        noActiveNotices: true,
        nextUnreadNotice: undefined,
      })

    case actions.UPDATE_GREENBELT_STATE:
      return extend(greenbeltState, action.value)

    case actions.UNLOCK_GREENBELT:
      return extend(greenbeltState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      })

    case actions.LOCK_GREENBELT:
      return extend(greenbeltState, {
        isUnlocked: false,
      })

    case actions.SET_RPC_LIST:
      return extend(greenbeltState, {
        frequentRpcList: action.value,
      })

    case actions.SET_RPC_TARGET:
      return extend(greenbeltState, {
        provider: {
          type: 'rpc',
          rpcTarget: action.value,
        },
      })

    case actions.SET_PROVIDER_TYPE:
      return extend(greenbeltState, {
        provider: {
          type: action.value,
        },
      })

    case actions.COMPLETED_TX:
      var stringId = String(action.id)
      newState = extend(greenbeltState, {
        unapprovedTxs: {},
        unapprovedMsgs: {},
      })
      for (const id in greenbeltState.unapprovedTxs) {
        if (id !== stringId) {
          newState.unapprovedTxs[id] = greenbeltState.unapprovedTxs[id]
        }
      }
      for (const id in greenbeltState.unapprovedMsgs) {
        if (id !== stringId) {
          newState.unapprovedMsgs[id] = greenbeltState.unapprovedMsgs[id]
        }
      }
      return newState

    case actions.EDIT_TX:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          editingTransactionId: action.value,
        },
      })


    case actions.SHOW_NEW_VAULT_SEED:
      return extend(greenbeltState, {
        isRevealingSeedWords: true,
        seedWords: action.value,
      })

    case actions.CLEAR_SEED_WORD_CACHE:
      newState = extend(greenbeltState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      })
      delete newState.seedWords
      return newState

    case actions.SHOW_ACCOUNT_DETAIL:
      newState = extend(greenbeltState, {
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      })
      delete newState.seedWords
      return newState

    case actions.SET_SELECTED_TOKEN:
      return extend(greenbeltState, {
        selectedTokenAddress: action.value,
      })

    case actions.SET_ACCOUNT_LABEL:
      const account = action.value.account
      const name = action.value.label
      const id = {}
      id[account] = extend(greenbeltState.identities[account], { name })
      const identities = extend(greenbeltState.identities, id)
      return extend(greenbeltState, { identities })

    case actions.SET_CURRENT_FIAT:
      return extend(greenbeltState, {
        currentCurrency: action.value.currentCurrency,
        conversionRate: action.value.conversionRate,
        conversionDate: action.value.conversionDate,
      })

    case actions.UPDATE_TOKENS:
      return extend(greenbeltState, {
        tokens: action.newTokens,
      })

    // greenbelt.send
    case actions.UPDATE_GAS_LIMIT:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          gasLimit: action.value,
        },
      })

    case actions.UPDATE_GAS_PRICE:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          gasPrice: action.value,
        },
      })

    case actions.TOGGLE_ACCOUNT_MENU:
      return extend(greenbeltState, {
        isAccountMenuOpen: !greenbeltState.isAccountMenuOpen,
      })

    case actions.UPDATE_GAS_TOTAL:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          gasTotal: action.value,
        },
      })

    case actions.UPDATE_SEND_TOKEN_BALANCE:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          tokenBalance: action.value,
        },
      })

    case actions.UPDATE_SEND_HEX_DATA:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          data: action.value,
        },
      })

    case actions.UPDATE_SEND_FROM:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          from: action.value,
        },
      })

    case actions.UPDATE_SEND_TO:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          to: action.value.to,
          toNickname: action.value.nickname,
        },
      })

    case actions.UPDATE_SEND_AMOUNT:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          amount: action.value,
        },
      })

    case actions.UPDATE_SEND_MEMO:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          memo: action.value,
        },
      })

    case actions.UPDATE_MAX_MODE:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          maxModeOn: action.value,
        },
      })

    case actions.UPDATE_SEND:
      return extend(greenbeltState, {
        send: {
          ...greenbeltState.send,
          ...action.value,
        },
      })

    case actions.CLEAR_SEND:
      return extend(greenbeltState, {
        send: {
          gasLimit: null,
          gasPrice: null,
          gasTotal: null,
          tokenBalance: null,
          from: '',
          to: '',
          amount: '0x0',
          memo: '',
          errors: {},
          maxModeOn: false,
          editingTransactionId: null,
          forceGasMin: null,
          toNickname: '',
        },
      })

    case actions.UPDATE_TRANSACTION_PARAMS:
      const { id: txId, value } = action
      let { selectedAddressTxList } = greenbeltState
      selectedAddressTxList = selectedAddressTxList.map(tx => {
        if (tx.id === txId) {
          tx.txParams = value
        }
        return tx
      })

      return extend(greenbeltState, {
        selectedAddressTxList,
      })

    case actions.PAIR_UPDATE:
      const { value: { marketinfo: pairMarketInfo } } = action
      return extend(greenbeltState, {
        tokenExchangeRates: {
          ...greenbeltState.tokenExchangeRates,
          [pairMarketInfo.pair]: pairMarketInfo,
        },
      })

    case actions.SHAPESHIFT_SUBVIEW:
      const { value: { marketinfo: ssMarketInfo, coinOptions } } = action
      return extend(greenbeltState, {
        tokenExchangeRates: {
          ...greenbeltState.tokenExchangeRates,
          [ssMarketInfo.pair]: ssMarketInfo,
        },
        coinOptions,
      })

    case actions.SET_USE_BLOCKIE:
      return extend(greenbeltState, {
        useBlockie: action.value,
      })

    case actions.UPDATE_FEATURE_FLAGS:
      return extend(greenbeltState, {
        featureFlags: action.value,
      })

    case actions.UPDATE_NETWORK_ENDPOINT_TYPE:
      return extend(greenbeltState, {
        networkEndpointType: action.value,
      })

    case actions.CLOSE_WELCOME_SCREEN:
      return extend(greenbeltState, {
        welcomeScreenSeen: true,
      })

    case actions.SET_CURRENT_LOCALE:
      return extend(greenbeltState, {
        currentLocale: action.value,
      })

    case actions.SET_PENDING_TOKENS:
      return extend(greenbeltState, {
        pendingTokens: { ...action.payload },
      })

    case actions.CLEAR_PENDING_TOKENS: {
      return extend(greenbeltState, {
        pendingTokens: {},
      })
    }

    case actions.UPDATE_PREFERENCES: {
      return extend(greenbeltState, {
        preferences: { ...action.payload },
      })
    }

    case actions.COMPLETE_ONBOARDING: {
      return extend(greenbeltState, {
        completedOnboarding: true,
      })
    }

    case actions.COMPLETE_UI_MIGRATION: {
      return extend(greenbeltState, {
        completedUiMigration: true,
      })
    }

    default:
      return greenbeltState

  }
}
