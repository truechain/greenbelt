import { connect } from 'react-redux'
import CreatePassword from './create-password.component'

const mapStateToProps = state => {
  const { greenbelt: { isInitialized } } = state

  return {
    isInitialized,
  }
}

export default connect(mapStateToProps)(CreatePassword)
