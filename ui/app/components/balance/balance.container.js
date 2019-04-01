import { connect } from 'react-redux'
import Balance from './balance.component'
import {
  getNativeCurrency,
  getAssetImages,
  conversionRateSelector,
  getCurrentCurrency,
  getGreenBeltAccounts,
} from '../../selectors'

const mapStateToProps = state => {
  const accounts = getGreenBeltAccounts(state)
  const network = state.greenbelt.network
  const selectedAddress = state.greenbelt.selectedAddress || Object.keys(accounts)[0]
  const account = accounts[selectedAddress]

  return {
    account,
    network,
    nativeCurrency: getNativeCurrency(state),
    conversionRate: conversionRateSelector(state),
    currentCurrency: getCurrentCurrency(state),
    assetImages: getAssetImages(state),
  }
}

export default connect(mapStateToProps)(Balance)
