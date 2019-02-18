const {
  TRUECHAIN,
  TRUECHAIN_CODE,
  TRUECHAIN_DISPLAY_NAME,
} = require('./enums')

const networkToNameMap = {
  [TRUECHAIN]: TRUECHAIN_DISPLAY_NAME,
  [TRUECHAIN_CODE]: TRUECHAIN_DISPLAY_NAME,
}

const getNetworkDisplayName = key => networkToNameMap[key]

module.exports = {
  getNetworkDisplayName,
}
