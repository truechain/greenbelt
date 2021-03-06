import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { closeWelcomeScreen } from '../../../../actions'
import Welcome from './welcome.component'

const mapStateToProps = ({ greenbelt }) => {
  const { welcomeScreenSeen, isInitialized } = greenbelt

  return {
    welcomeScreenSeen,
    isInitialized,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    closeWelcomeScreen: () => dispatch(closeWelcomeScreen()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Welcome)
