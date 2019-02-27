'use strict'

const web3t = window.web3t
const truechain = window.truechain

window.step1 = function setp1 () {
  if (!web3t) {
    alert('请检查Grennbelt插件是否开启！')
    return
  }
  truechain.enable()
    .then(addresses => {
      alert(`授权成功，目前账户内有${addresses.length}个地址`)
    })
    .catch(() => {
      alert(`授权失败`)
    })
}

window.step2 = function setp2 () {
  if (!web3t) {
    alert('请检查Grennbelt插件是否开启！')
    return
  }
  web3t.eth.sendTransaction({
    to: '0x0000000000000000000000000000000000000000',
    value: '1000000000000000000',
    gasPrice: '10000000000',
  }, result => {
    alert(result.message || result)
  })
}
