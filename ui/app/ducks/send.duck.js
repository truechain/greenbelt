import extend from 'xtend'

// Actions
const OPEN_FROM_DROPDOWN = 'greenbelt/send/OPEN_FROM_DROPDOWN'
const CLOSE_FROM_DROPDOWN = 'greenbelt/send/CLOSE_FROM_DROPDOWN'
const OPEN_TO_DROPDOWN = 'greenbelt/send/OPEN_TO_DROPDOWN'
const CLOSE_TO_DROPDOWN = 'greenbelt/send/CLOSE_TO_DROPDOWN'
const UPDATE_SEND_ERRORS = 'greenbelt/send/UPDATE_SEND_ERRORS'
const UPDATE_SEND_WARNINGS = 'greenbelt/send/UPDATE_SEND_WARNINGS'
const RESET_SEND_STATE = 'greenbelt/send/RESET_SEND_STATE'
const SHOW_GAS_BUTTON_GROUP = 'greenbelt/send/SHOW_GAS_BUTTON_GROUP'
const HIDE_GAS_BUTTON_GROUP = 'greenbelt/send/HIDE_GAS_BUTTON_GROUP'

// TODO: determine if this approach to initState is consistent with conventional ducks pattern
const initState = {
  fromDropdownOpen: false,
  toDropdownOpen: false,
  gasButtonGroupShown: true,
  errors: {},
  warnings: {},
}

// Reducer
export default function reducer ({ send: sendState = initState }, action = {}) {
  const newState = extend({}, sendState)

  switch (action.type) {
    case OPEN_FROM_DROPDOWN:
      return extend(newState, {
        fromDropdownOpen: true,
      })
    case CLOSE_FROM_DROPDOWN:
      return extend(newState, {
        fromDropdownOpen: false,
      })
    case OPEN_TO_DROPDOWN:
      return extend(newState, {
        toDropdownOpen: true,
      })
    case CLOSE_TO_DROPDOWN:
      return extend(newState, {
        toDropdownOpen: false,
      })
    case UPDATE_SEND_ERRORS:
      return extend(newState, {
        errors: {
          ...newState.errors,
          ...action.value,
        },
      })
    case UPDATE_SEND_WARNINGS:
      return extend(newState, {
        warnings: {
          ...newState.warnings,
          ...action.value,
        },
      })
    case SHOW_GAS_BUTTON_GROUP:
      return extend(newState, {
        gasButtonGroupShown: true,
      })
    case HIDE_GAS_BUTTON_GROUP:
      return extend(newState, {
        gasButtonGroupShown: false,
      })
    case RESET_SEND_STATE:
      return extend({}, initState)
    default:
      return newState
  }
}

// Action Creators
export function openToDropdown () {
  return { type: OPEN_TO_DROPDOWN }
}

export function closeToDropdown () {
  return { type: CLOSE_TO_DROPDOWN }
}

export function showGasButtonGroup () {
  return { type: SHOW_GAS_BUTTON_GROUP }
}

export function hideGasButtonGroup () {
  return { type: HIDE_GAS_BUTTON_GROUP }
}

export function updateSendErrors (errorObject) {
  return {
    type: UPDATE_SEND_ERRORS,
    value: errorObject,
  }
}

export function updateSendWarnings (warningObject) {
  return {
    type: UPDATE_SEND_WARNINGS,
    value: warningObject,
  }
}

export function resetSendState () {
  return { type: RESET_SEND_STATE }
}
