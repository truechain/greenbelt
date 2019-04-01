import Lock from './lock.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { lockGreenbelt } from '../../../actions'

const mapStateToProps = state => {
  const { greenbelt: { isUnlocked } } = state

  return {
    isUnlocked,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    lockGreenbelt: () => dispatch(lockGreenbelt()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Lock)
