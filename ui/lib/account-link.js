module.exports = function (address, network) {
  const net = parseInt(network)
  let link
  switch (net) {
    case 19330: // truechain
      link = `https://www.truescan.net/address/${address}`
      break
    case 18928: // true test
      link = `https://test.truescan.net/address/${address}`
      break
    default:
      link = ''
      break
  }

  return link
}
