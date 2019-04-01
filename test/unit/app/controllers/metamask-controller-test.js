const assert = require('assert')
const sinon = require('sinon')
const clone = require('clone')
const nock = require('nock')
const createThoughStream = require('through2').obj
const blacklistJSON = require('eth-phishing-detect/src/config')
const GreenBeltController = require('../../../../app/scripts/greenbelt-controller')
const firstTimeState = require('../../../unit/localhostState')
const createTxMeta = require('../../../lib/createTxMeta')
const EthQuery = require('eth-query')

const currentNetworkId = 42
const DEFAULT_LABEL = 'Account 1'
const DEFAULT_LABEL_2 = 'Account 2'
const TEST_SEED = 'debris dizzy just program just float decrease vacant alarm reduce speak stadium'
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
const TEST_ADDRESS_2 = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b'
const TEST_ADDRESS_3 = '0xeb9e64b93097bc15f01f13eae97015c57ab64823'
const TEST_SEED_ALT = 'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle'
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'
const CUSTOM_RPC_URL = 'http://localhost:8545'

describe('GreenBeltController', function () {
  let greenbeltController
  const sandbox = sinon.createSandbox()
  const noop = () => {}

  beforeEach(function () {

    nock('https://api.infura.io')
      .persist()
      .get('/v2/blacklist')
      .reply(200, blacklistJSON)

    nock('https://api.infura.io')
      .get('/v1/ticker/ethusd')
      .reply(200, '{"base": "ETH", "quote": "USD", "bid": 288.45, "ask": 288.46, "volume": 112888.17569277, "exchange": "bitfinex", "total_volume": 272175.00106721005, "num_exchanges": 8, "timestamp": 1506444677}')

    nock('https://api.infura.io')
      .get('/v1/ticker/ethjpy')
      .reply(200, '{"base": "ETH", "quote": "JPY", "bid": 32300.0, "ask": 32400.0, "volume": 247.4616071, "exchange": "kraken", "total_volume": 247.4616071, "num_exchanges": 1, "timestamp": 1506444676}')

    nock('https://api.infura.io')
      .persist()
      .get(/.*/)
      .reply(200)

    greenbeltController = new GreenBeltController({
      showUnapprovedTx: noop,
      showUnconfirmedMessage: noop,
      encryptor: {
        encrypt: function (password, object) {
          this.object = object
          return Promise.resolve('mock-encrypted')
        },
        decrypt: function () {
          return Promise.resolve(this.object)
        },
      },
      initState: clone(firstTimeState),
      platform: { showTransactionNotification: () => {} },
    })
    // disable diagnostics
    greenbeltController.diagnostics = null
    // add sinon method spies
    sandbox.spy(greenbeltController.keyringController, 'createNewVaultAndKeychain')
    sandbox.spy(greenbeltController.keyringController, 'createNewVaultAndRestore')
  })

  afterEach(function () {
    nock.cleanAll()
    sandbox.restore()
  })

  describe('submitPassword', function () {
    const password = 'password'

    beforeEach(async function () {
      await greenbeltController.createNewVaultAndKeychain(password)
    })

    it('removes any identities that do not correspond to known accounts.', async function () {
      const fakeAddress = '0xbad0'
      greenbeltController.preferencesController.addAddresses([fakeAddress])
      await greenbeltController.submitPassword(password)

      const identities = Object.keys(greenbeltController.preferencesController.store.getState().identities)
      const addresses = await greenbeltController.keyringController.getAccounts()

      identities.forEach((identity) => {
        assert.ok(addresses.includes(identity), `addresses should include all IDs: ${identity}`)
      })

      addresses.forEach((address) => {
        assert.ok(identities.includes(address), `identities should include all Addresses: ${address}`)
      })
    })
  })

  describe('#getGasPrice', function () {

    it('gives the 50th percentile lowest accepted gas price from recentBlocksController', async function () {
      const realRecentBlocksController = greenbeltController.recentBlocksController
      greenbeltController.recentBlocksController = {
        store: {
          getState: () => {
            return {
              recentBlocks: [
                { gasPrices: [ '0x3b9aca00', '0x174876e800'] },
                { gasPrices: [ '0x3b9aca00', '0x174876e800'] },
                { gasPrices: [ '0x174876e800', '0x174876e800' ]},
                { gasPrices: [ '0x174876e800', '0x174876e800' ]},
              ],
            }
          },
        },
      }

      const gasPrice = greenbeltController.getGasPrice()
      assert.equal(gasPrice, '0x174876e800', 'accurately estimates 65th percentile accepted gas price')

      greenbeltController.recentBlocksController = realRecentBlocksController
    })
  })

  describe('#createNewVaultAndKeychain', function () {
    it('can only create new vault on keyringController once', async function () {
      const selectStub = sandbox.stub(greenbeltController, 'selectFirstIdentity')

      const password = 'a-fake-password'

      await greenbeltController.createNewVaultAndKeychain(password)
      await greenbeltController.createNewVaultAndKeychain(password)

      assert(greenbeltController.keyringController.createNewVaultAndKeychain.calledOnce)

      selectStub.reset()
    })
  })

  describe('#createNewVaultAndRestore', function () {
    it('should be able to call newVaultAndRestore despite a mistake.', async function () {
      const password = 'what-what-what'
      sandbox.stub(greenbeltController, 'getBalance')
      greenbeltController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await greenbeltController.createNewVaultAndRestore(password, TEST_SEED.slice(0, -1)).catch((e) => null)
      await greenbeltController.createNewVaultAndRestore(password, TEST_SEED)

      assert(greenbeltController.keyringController.createNewVaultAndRestore.calledTwice)
    })

    it('should clear previous identities after vault restoration', async () => {
      sandbox.stub(greenbeltController, 'getBalance')
      greenbeltController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await greenbeltController.createNewVaultAndRestore('foobar1337', TEST_SEED)
      assert.deepEqual(greenbeltController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
      })

      await greenbeltController.preferencesController.setAccountLabel(TEST_ADDRESS, 'Account Foo')
      assert.deepEqual(greenbeltController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: 'Account Foo' },
      })

      await greenbeltController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)
      assert.deepEqual(greenbeltController.getState().identities, {
        [TEST_ADDRESS_ALT]: { address: TEST_ADDRESS_ALT, name: DEFAULT_LABEL },
      })
    })

    it('should restore any consecutive accounts with balances', async () => {
      sandbox.stub(greenbeltController, 'getBalance')
      greenbeltController.getBalance.withArgs(TEST_ADDRESS).callsFake(() => {
        return Promise.resolve('0x14ced5122ce0a000')
      })
      greenbeltController.getBalance.withArgs(TEST_ADDRESS_2).callsFake(() => {
        return Promise.resolve('0x0')
      })
      greenbeltController.getBalance.withArgs(TEST_ADDRESS_3).callsFake(() => {
        return Promise.resolve('0x14ced5122ce0a000')
      })

      await greenbeltController.createNewVaultAndRestore('foobar1337', TEST_SEED)
      assert.deepEqual(greenbeltController.getState().identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
        [TEST_ADDRESS_2]: { address: TEST_ADDRESS_2, name: DEFAULT_LABEL_2 },
      })
    })
  })

  describe('#getBalance', () => {
    it('should return the balance known by accountTracker', async () => {
      const accounts = {}
      const balance = '0x14ced5122ce0a000'
      accounts[TEST_ADDRESS] = { balance: balance }

      greenbeltController.accountTracker.store.putState({ accounts: accounts })

      const gotten = await greenbeltController.getBalance(TEST_ADDRESS)

      assert.equal(balance, gotten)
    })

    it('should ask the network for a balance when not known by accountTracker', async () => {
      const accounts = {}
      const balance = '0x14ced5122ce0a000'
      const ethQuery = new EthQuery()
      sinon.stub(ethQuery, 'getBalance').callsFake((account, callback) => {
        callback(undefined, balance)
      })

      greenbeltController.accountTracker.store.putState({ accounts: accounts })

      const gotten = await greenbeltController.getBalance(TEST_ADDRESS, ethQuery)

      assert.equal(balance, gotten)
    })
  })

  describe('#getApi', function () {
    let getApi, state

    beforeEach(function () {
      getApi = greenbeltController.getApi()
    })

    it('getState', function (done) {
      getApi.getState((err, res) => {
        if (err) {
          done(err)
        } else {
          state = res
        }
      })
      assert.deepEqual(state, greenbeltController.getState())
      done()
    })

  })

  describe('preferencesController', function () {

    it('defaults useBlockie to false', function () {
      assert.equal(greenbeltController.preferencesController.store.getState().useBlockie, false)
    })

    it('setUseBlockie to true', function () {
      greenbeltController.setUseBlockie(true, noop)
      assert.equal(greenbeltController.preferencesController.store.getState().useBlockie, true)
    })

  })

  describe('#selectFirstIdentity', function () {
    let identities, address

    beforeEach(function () {
      address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
      identities = {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          'address': address,
          'name': 'Account 1',
        },
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
          'address': '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          'name': 'Account 2',
        },
      }
      greenbeltController.preferencesController.store.updateState({ identities })
      greenbeltController.selectFirstIdentity()
    })

    it('changes preferences controller select address', function () {
      const preferenceControllerState = greenbeltController.preferencesController.store.getState()
      assert.equal(preferenceControllerState.selectedAddress, address)
    })

    it('changes greenbelt controller selected address', function () {
      const greenbeltState = greenbeltController.getState()
      assert.equal(greenbeltState.selectedAddress, address)
    })
  })

  describe('connectHardware', function () {

    it('should throw if it receives an unknown device name', async function () {
      try {
        await greenbeltController.connectHardware('Some random device name', 0, `m/44/0'/0'`)
      } catch (e) {
        assert.equal(e, 'Error: GreenbeltController:getKeyringForDevice - Unknown device')
      }
    })

    it('should add the Trezor Hardware keyring', async function () {
      sinon.spy(greenbeltController.keyringController, 'addNewKeyring')
      await greenbeltController.connectHardware('trezor', 0).catch((e) => null)
      const keyrings = await greenbeltController.keyringController.getKeyringsByType(
        'Trezor Hardware'
      )
      assert.equal(greenbeltController.keyringController.addNewKeyring.getCall(0).args, 'Trezor Hardware')
      assert.equal(keyrings.length, 1)
    })

    it('should add the Ledger Hardware keyring', async function () {
      sinon.spy(greenbeltController.keyringController, 'addNewKeyring')
      await greenbeltController.connectHardware('ledger', 0).catch((e) => null)
      const keyrings = await greenbeltController.keyringController.getKeyringsByType(
        'Ledger Hardware'
      )
      assert.equal(greenbeltController.keyringController.addNewKeyring.getCall(0).args, 'Ledger Hardware')
      assert.equal(keyrings.length, 1)
    })

  })

  describe('checkHardwareStatus', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await greenbeltController.checkHardwareStatus('Some random device name', `m/44/0'/0'`)
      } catch (e) {
        assert.equal(e, 'Error: GreenbeltController:getKeyringForDevice - Unknown device')
      }
    })

    it('should be locked by default', async function () {
      await greenbeltController.connectHardware('trezor', 0).catch((e) => null)
      const status = await greenbeltController.checkHardwareStatus('trezor')
      assert.equal(status, false)
    })
  })

  describe('forgetDevice', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await greenbeltController.forgetDevice('Some random device name')
      } catch (e) {
        assert.equal(e, 'Error: GreenbeltController:getKeyringForDevice - Unknown device')
      }
    })

    it('should wipe all the keyring info', async function () {
      await greenbeltController.connectHardware('trezor', 0).catch((e) => null)
      await greenbeltController.forgetDevice('trezor')
      const keyrings = await greenbeltController.keyringController.getKeyringsByType(
        'Trezor Hardware'
      )

      assert.deepEqual(keyrings[0].accounts, [])
      assert.deepEqual(keyrings[0].page, 0)
      assert.deepEqual(keyrings[0].isUnlocked(), false)
    })
  })

  describe('unlockHardwareWalletAccount', function () {
    let accountToUnlock
    let windowOpenStub
    let addNewAccountStub
    let getAccountsStub
    beforeEach(async function () {
      accountToUnlock = 10
      windowOpenStub = sinon.stub(window, 'open')
      windowOpenStub.returns(noop)

      addNewAccountStub = sinon.stub(greenbeltController.keyringController, 'addNewAccount')
      addNewAccountStub.returns({})

      getAccountsStub = sinon.stub(greenbeltController.keyringController, 'getAccounts')
      // Need to return different address to mock the behavior of
      // adding a new account from the keyring
      getAccountsStub.onCall(0).returns(Promise.resolve(['0x1']))
      getAccountsStub.onCall(1).returns(Promise.resolve(['0x2']))
      getAccountsStub.onCall(2).returns(Promise.resolve(['0x3']))
      getAccountsStub.onCall(3).returns(Promise.resolve(['0x4']))
      sinon.spy(greenbeltController.preferencesController, 'setAddresses')
      sinon.spy(greenbeltController.preferencesController, 'setSelectedAddress')
      sinon.spy(greenbeltController.preferencesController, 'setAccountLabel')
      await greenbeltController.connectHardware('trezor', 0, `m/44/0'/0'`).catch((e) => null)
      await greenbeltController.unlockHardwareWalletAccount(accountToUnlock, 'trezor', `m/44/0'/0'`)
    })

    afterEach(function () {
      window.open.restore()
      greenbeltController.keyringController.addNewAccount.restore()
      greenbeltController.keyringController.getAccounts.restore()
      greenbeltController.preferencesController.setAddresses.restore()
      greenbeltController.preferencesController.setSelectedAddress.restore()
      greenbeltController.preferencesController.setAccountLabel.restore()
    })

    it('should set unlockedAccount in the keyring', async function () {
      const keyrings = await greenbeltController.keyringController.getKeyringsByType(
        'Trezor Hardware'
      )
      assert.equal(keyrings[0].unlockedAccount, accountToUnlock)
    })


    it('should call keyringController.addNewAccount', async function () {
      assert(greenbeltController.keyringController.addNewAccount.calledOnce)
    })

    it('should call keyringController.getAccounts ', async function () {
      assert(greenbeltController.keyringController.getAccounts.called)
    })

    it('should call preferencesController.setAddresses', async function () {
      assert(greenbeltController.preferencesController.setAddresses.calledOnce)
    })

    it('should call preferencesController.setSelectedAddress', async function () {
      assert(greenbeltController.preferencesController.setSelectedAddress.calledOnce)
    })

    it('should call preferencesController.setAccountLabel', async function () {
      assert(greenbeltController.preferencesController.setAccountLabel.calledOnce)
    })


  })

  describe('#setCustomRpc', function () {
    let rpcTarget

    beforeEach(function () {
      rpcTarget = greenbeltController.setCustomRpc(CUSTOM_RPC_URL)
    })

    it('returns custom RPC that when called', async function () {
      assert.equal(await rpcTarget, CUSTOM_RPC_URL)
    })

    it('changes the network controller rpc', function () {
      const networkControllerState = greenbeltController.networkController.store.getState()
      assert.equal(networkControllerState.provider.rpcTarget, CUSTOM_RPC_URL)
    })
  })

  describe('#setCurrentCurrency', function () {
    let defaultGreenBeltCurrency

    beforeEach(function () {
      defaultGreenBeltCurrency = greenbeltController.currencyController.getCurrentCurrency()
    })

    it('defaults to usd', function () {
      assert.equal(defaultGreenBeltCurrency, 'usd')
    })

    it('sets currency to JPY', function () {
      greenbeltController.setCurrentCurrency('JPY', noop)
      assert.equal(greenbeltController.currencyController.getCurrentCurrency(), 'JPY')
    })
  })

  describe('#createShapeshifttx', function () {
    let depositAddress, depositType, shapeShiftTxList

    beforeEach(function () {
      nock('https://shapeshift.io')
        .get('/txStat/3EevLFfB4H4XMWQwYCgjLie1qCAGpd2WBc')
        .reply(200, '{"status": "no_deposits", "address": "3EevLFfB4H4XMWQwYCgjLie1qCAGpd2WBc"}')

      depositAddress = '3EevLFfB4H4XMWQwYCgjLie1qCAGpd2WBc'
      depositType = 'ETH'
      shapeShiftTxList = greenbeltController.shapeshiftController.store.getState().shapeShiftTxList
    })

    it('creates a shapeshift tx', async function () {
      greenbeltController.createShapeShiftTx(depositAddress, depositType)
      assert.equal(shapeShiftTxList[0].depositAddress, depositAddress)
    })

  })

  describe('#addNewAccount', function () {
    let addNewAccount

    beforeEach(function () {
      addNewAccount = greenbeltController.addNewAccount()
    })

    it('errors when an primary keyring is does not exist', async function () {
      try {
        await addNewAccount
        assert.equal(1 === 0)
      } catch (e) {
        assert.equal(e.message, 'GreenbeltController - No HD Key Tree found')
      }
    })
  })

  describe('#verifyseedPhrase', function () {
    let seedPhrase, getConfigSeed

    it('errors when no keying is provided', async function () {
      try {
        await greenbeltController.verifySeedPhrase()
      } catch (error) {
        assert.equal(error.message, 'GreenbeltController - No HD Key Tree found')
      }
    })

    beforeEach(async function () {
      await greenbeltController.createNewVaultAndKeychain('password')
      seedPhrase = await greenbeltController.verifySeedPhrase()
    })

    it('#placeSeedWords should match the initially created vault seed', function () {

      greenbeltController.placeSeedWords((err, result) => {
        if (err) {
         console.log(err)
        } else {
          getConfigSeed = greenbeltController.configManager.getSeedWords()
          assert.equal(result, seedPhrase)
          assert.equal(result, getConfigSeed)
        }
      })
      assert.equal(getConfigSeed, undefined)
    })

    it('#addNewAccount', async function () {
      await greenbeltController.addNewAccount()
      const getAccounts = await greenbeltController.keyringController.getAccounts()
      assert.equal(getAccounts.length, 2)
    })
  })

  describe('#resetAccount', function () {

    beforeEach(function () {
      const selectedAddressStub = sinon.stub(greenbeltController.preferencesController, 'getSelectedAddress')
      const getNetworkstub = sinon.stub(greenbeltController.txController.txStateManager, 'getNetwork')

      selectedAddressStub.returns('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
      getNetworkstub.returns(42)

      greenbeltController.txController.txStateManager._saveTxList([
        createTxMeta({ id: 1, status: 'unapproved', greenbeltNetworkId: currentNetworkId, txParams: {from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'} }),
        createTxMeta({ id: 1, status: 'unapproved', greenbeltNetworkId: currentNetworkId, txParams: {from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'} }),
        createTxMeta({ id: 2, status: 'rejected', greenbeltNetworkId: 32 }),
        createTxMeta({ id: 3, status: 'submitted', greenbeltNetworkId: currentNetworkId, txParams: {from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4'} }),
      ])
    })

    it('wipes transactions from only the correct network id and with the selected address', async function () {
      await greenbeltController.resetAccount()
      assert.equal(greenbeltController.txController.txStateManager.getTx(1), undefined)
    })
  })

  describe('#removeAccount', function () {
    let ret
    const addressToRemove = '0x1'

    beforeEach(async function () {
      sinon.stub(greenbeltController.preferencesController, 'removeAddress')
      sinon.stub(greenbeltController.accountTracker, 'removeAccount')
      sinon.stub(greenbeltController.keyringController, 'removeAccount')

      ret = await greenbeltController.removeAccount(addressToRemove)

    })

    afterEach(function () {
      greenbeltController.keyringController.removeAccount.restore()
      greenbeltController.accountTracker.removeAccount.restore()
      greenbeltController.preferencesController.removeAddress.restore()
    })

    it('should call preferencesController.removeAddress', async function () {
      assert(greenbeltController.preferencesController.removeAddress.calledWith(addressToRemove))
    })
    it('should call accountTracker.removeAccount', async function () {
      assert(greenbeltController.accountTracker.removeAccount.calledWith([addressToRemove]))
    })
    it('should call keyringController.removeAccount', async function () {
      assert(greenbeltController.keyringController.removeAccount.calledWith(addressToRemove))
    })
    it('should return address', async function () {
      assert.equal(ret, '0x1')
    })
  })

  describe('#clearSeedWordCache', function () {
    it('should set seed words to null', function (done) {
      sandbox.stub(greenbeltController.preferencesController, 'setSeedWords')
      greenbeltController.clearSeedWordCache((err) => {
        if (err) {
          done(err)
        }

        assert.ok(greenbeltController.preferencesController.setSeedWords.calledOnce)
        assert.deepEqual(greenbeltController.preferencesController.setSeedWords.args, [[null]])
        done()
      })
    })
  })

  describe('#setCurrentLocale', function () {

    it('checks the default currentLocale', function () {
      const preferenceCurrentLocale = greenbeltController.preferencesController.store.getState().currentLocale
      assert.equal(preferenceCurrentLocale, undefined)
    })

    it('sets current locale in preferences controller', function () {
      greenbeltController.setCurrentLocale('ja', noop)
      const preferenceCurrentLocale = greenbeltController.preferencesController.store.getState().currentLocale
      assert.equal(preferenceCurrentLocale, 'ja')
    })

  })

  describe('#newUnsignedMessage', () => {

    let msgParams, greenbeltMsgs, messages, msgId

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'
    const data = '0x43727970746f6b697474696573'

    beforeEach(async () => {
      sandbox.stub(greenbeltController, 'getBalance')
      greenbeltController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await greenbeltController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)

      msgParams = {
        'from': address,
        'data': data,
      }

      const promise = greenbeltController.newUnsignedMessage(msgParams)
      // handle the promise so it doesn't throw an unhandledRejection
      promise.then(noop).catch(noop)

      greenbeltMsgs = greenbeltController.messageManager.getUnapprovedMsgs()
      messages = greenbeltController.messageManager.messages
      msgId = Object.keys(greenbeltMsgs)[0]
      messages[0].msgParams.greenbeltId = parseInt(msgId)
    })

    it('persists address from msg params', function () {
      assert.equal(greenbeltMsgs[msgId].msgParams.from, address)
    })

    it('persists data from msg params', function () {
      assert.equal(greenbeltMsgs[msgId].msgParams.data, data)
    })

    it('sets the status to unapproved', function () {
      assert.equal(greenbeltMsgs[msgId].status, 'unapproved')
    })

    it('sets the type to eth_sign', function () {
      assert.equal(greenbeltMsgs[msgId].type, 'eth_sign')
    })

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId)
      greenbeltController.cancelMessage(msgIdInt, noop)
      assert.equal(messages[0].status, 'rejected')
    })

    it('errors when signing a message', async function () {
      try {
        await greenbeltController.signMessage(messages[0].msgParams)
      } catch (error) {
        assert.equal(error.message, 'message length is invalid')
      }
    })
  })

  describe('#newUnsignedPersonalMessage', function () {

    it('errors with no from in msgParams', async () => {
      const msgParams = {
        'data': data,
      }
      try {
        await greenbeltController.newUnsignedPersonalMessage(msgParams)
        assert.fail('should have thrown')
      } catch (error) {
        assert.equal(error.message, 'GreenBelt Message Signature: from field is required.')
      }
    })

    let msgParams, greenbeltPersonalMsgs, personalMessages, msgId

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'
    const data = '0x43727970746f6b697474696573'

    beforeEach(async function () {
      sandbox.stub(greenbeltController, 'getBalance')
      greenbeltController.getBalance.callsFake(() => { return Promise.resolve('0x0') })

      await greenbeltController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)

      msgParams = {
        'from': address,
        'data': data,
      }

      const promise = greenbeltController.newUnsignedPersonalMessage(msgParams)
      // handle the promise so it doesn't throw an unhandledRejection
      promise.then(noop).catch(noop)

      greenbeltPersonalMsgs = greenbeltController.personalMessageManager.getUnapprovedMsgs()
      personalMessages = greenbeltController.personalMessageManager.messages
      msgId = Object.keys(greenbeltPersonalMsgs)[0]
      personalMessages[0].msgParams.greenbeltId = parseInt(msgId)
    })

    it('persists address from msg params', function () {
      assert.equal(greenbeltPersonalMsgs[msgId].msgParams.from, address)
    })

    it('persists data from msg params', function () {
      assert.equal(greenbeltPersonalMsgs[msgId].msgParams.data, data)
    })

    it('sets the status to unapproved', function () {
      assert.equal(greenbeltPersonalMsgs[msgId].status, 'unapproved')
    })

    it('sets the type to personal_sign', function () {
      assert.equal(greenbeltPersonalMsgs[msgId].type, 'personal_sign')
    })

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId)
      greenbeltController.cancelPersonalMessage(msgIdInt, noop)
      assert.equal(personalMessages[0].status, 'rejected')
    })

    it('errors when signing a message', async function () {
      await greenbeltController.signPersonalMessage(personalMessages[0].msgParams)
      assert.equal(greenbeltPersonalMsgs[msgId].status, 'signed')
      assert.equal(greenbeltPersonalMsgs[msgId].rawSig, '0x6a1b65e2b8ed53cf398a769fad24738f9fbe29841fe6854e226953542c4b6a173473cb152b6b1ae5f06d601d45dd699a129b0a8ca84e78b423031db5baa734741b')
    })
  })

  describe('#setupUntrustedCommunication', function () {
    let streamTest

    const phishingUrl = 'myethereumwalletntw.com'

    afterEach(function () {
      streamTest.end()
    })

    it('sets up phishing stream for untrusted communication ', async () => {
      await greenbeltController.blacklistController.updatePhishingList()
      console.log(blacklistJSON.blacklist.includes(phishingUrl))

      const { promise, resolve } = deferredPromise()

      streamTest = createThoughStream((chunk, enc, cb) => {
        if (chunk.name !== 'phishing') return cb()
        assert.equal(chunk.data.hostname, phishingUrl)
        resolve()
        cb()
      })
      greenbeltController.setupUntrustedCommunication(streamTest, phishingUrl)

      await promise
    })
  })

  describe('#setupTrustedCommunication', function () {
    let streamTest

    afterEach(function () {
      streamTest.end()
    })

    it('sets up controller dnode api for trusted communication', function (done) {
      streamTest = createThoughStream((chunk, enc, cb) => {
        assert.equal(chunk.name, 'controller')
        cb()
        done()
      })

      greenbeltController.setupTrustedCommunication(streamTest, 'mycrypto.com')
    })
  })

  describe('#markAccountsFound', function () {
    it('adds lost accounts to config manager data', function () {
      greenbeltController.markAccountsFound(noop)
      const state = greenbeltController.getState()
      assert.deepEqual(state.lostAccounts, [])
    })
  })

  describe('#markPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to true', function () {
      greenbeltController.markPasswordForgotten(noop)
      const state = greenbeltController.getState()
      assert.equal(state.forgottenPassword, true)
    })
  })

  describe('#unMarkPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to false', function () {
      greenbeltController.unMarkPasswordForgotten(noop)
      const state = greenbeltController.getState()
      assert.equal(state.forgottenPassword, false)
    })
  })

  describe('#_onKeyringControllerUpdate', function () {
    it('should do nothing if there are no keyrings in state', async function () {
      const addAddresses = sinon.fake()
      const syncWithAddresses = sinon.fake()
      sandbox.replace(greenbeltController, 'preferencesController', {
        addAddresses,
      })
      sandbox.replace(greenbeltController, 'accountTracker', {
        syncWithAddresses,
      })

      const oldState = greenbeltController.getState()
      await greenbeltController._onKeyringControllerUpdate({keyrings: []})

      assert.ok(addAddresses.notCalled)
      assert.ok(syncWithAddresses.notCalled)
      assert.deepEqual(greenbeltController.getState(), oldState)
    })

    it('should update selected address if keyrings was locked', async function () {
      const addAddresses = sinon.fake()
      const getSelectedAddress = sinon.fake.returns('0x42')
      const setSelectedAddress = sinon.fake()
      const syncWithAddresses = sinon.fake()
      sandbox.replace(greenbeltController, 'preferencesController', {
        addAddresses,
        getSelectedAddress,
        setSelectedAddress,
      })
      sandbox.replace(greenbeltController, 'accountTracker', {
        syncWithAddresses,
      })

      const oldState = greenbeltController.getState()
      await greenbeltController._onKeyringControllerUpdate({
        isUnlocked: false,
        keyrings: [{
          accounts: ['0x1', '0x2'],
        }],
      })

      assert.deepEqual(addAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(syncWithAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(setSelectedAddress.args, [['0x1']])
      assert.deepEqual(greenbeltController.getState(), oldState)
    })

    it('should NOT update selected address if already unlocked', async function () {
      const addAddresses = sinon.fake()
      const syncWithAddresses = sinon.fake()
      sandbox.replace(greenbeltController, 'preferencesController', {
        addAddresses,
      })
      sandbox.replace(greenbeltController, 'accountTracker', {
        syncWithAddresses,
      })

      const oldState = greenbeltController.getState()
      await greenbeltController._onKeyringControllerUpdate({
        isUnlocked: true,
        keyrings: [{
          accounts: ['0x1', '0x2'],
        }],
      })

      assert.deepEqual(addAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(syncWithAddresses.args, [[['0x1', '0x2']]])
      assert.deepEqual(greenbeltController.getState(), oldState)
    })
  })

})

function deferredPromise () {
  let resolve
  const promise = new Promise(_resolve => { resolve = _resolve })
  return { promise, resolve }
}
