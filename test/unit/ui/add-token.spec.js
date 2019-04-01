const assert = require('assert')
const { createMockStore } = require('redux-test-utils')
const h = require('react-hyperscript')
const { shallowWithStore } = require('../../lib/render-helpers')
const AddTokenScreen = require('../../../old-ui/app/add-token')

describe('Add Token Screen', function () {
  let addTokenComponent, store, component
  const mockState = {
    greenbelt: {
      identities: {
        '0x7d3517b0d011698406d6e0aed8453f0be2697926': {
          'address': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
          'name': 'Add Token Name',
        },
      },
    },
  }
  beforeEach(function () {
    store = createMockStore(mockState)
    component = shallowWithStore(h(AddTokenScreen), store)
    addTokenComponent = component.dive()
  })

  describe('#ValidateInputs', function () {

    it('Default State', function () {
      addTokenComponent.instance().validateInputs()
      const state = addTokenComponent.state()
      assert.equal(state.warning, 'Address is invalid.')
    })

    it('Address is a Greenbelt Identity', function () {
      addTokenComponent.setState({
        address: '0x7d3517b0d011698406d6e0aed8453f0be2697926',
      })
      addTokenComponent.instance().validateInputs()
      const state = addTokenComponent.state()
      assert.equal(state.warning, 'Personal address detected. Input the token contract address.')
    })

  })
})
