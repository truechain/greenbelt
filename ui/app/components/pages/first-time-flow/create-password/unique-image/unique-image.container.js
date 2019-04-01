import { connect } from 'react-redux'
import UniqueImage from './unique-image.component'

const mapStateToProps = ({ greenbelt }) => {
  const { selectedAddress } = greenbelt

  return {
    address: selectedAddress,
  }
}

export default connect(mapStateToProps)(UniqueImage)
