const assert = require('assert')
const txHelper = require('../../../../../ui/lib/tx-helper')

describe('txHelper', function () {
  it('always shows the oldest tx first', function () {
    const greenbeltNetworkId = 1
    const txs = {
      a: { greenbeltNetworkId, time: 3 },
      b: { greenbeltNetworkId, time: 1 },
      c: { greenbeltNetworkId, time: 2 },
    }

    const sorted = txHelper(txs, null, null, greenbeltNetworkId)
    assert.equal(sorted[0].time, 1, 'oldest tx first')
    assert.equal(sorted[2].time, 3, 'newest tx last')
  })
})
