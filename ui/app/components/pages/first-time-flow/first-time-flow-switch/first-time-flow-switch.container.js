import { connect } from 'react-redux'
import FirstTimeFlowSwitch from './first-time-flow-switch.component'

const mapStateToProps = ({ greenbelt }) => {
  const {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    noActiveNotices,
  } = greenbelt

  return {
    completedOnboarding,
    isInitialized,
    isUnlocked,
    noActiveNotices,
  }
}

export default connect(mapStateToProps)(FirstTimeFlowSwitch)
