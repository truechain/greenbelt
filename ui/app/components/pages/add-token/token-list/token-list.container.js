import { connect } from 'react-redux'
import TokenList from './token-list.component'

const mapStateToProps = ({ greenbelt }) => {
  const { tokens } = greenbelt
  return {
    tokens,
  }
}

export default connect(mapStateToProps)(TokenList)
