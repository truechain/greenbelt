module.exports = function (network) {
  const net = parseInt(network)
  let url
  switch (net) {
    case 19330: // main net
      url = 'https://www.truescan.net'
      break
    case 18928: // test net
      url = 'https://test.truescan.net'
      break
    default:
      url = ''
  }
  return url
}
