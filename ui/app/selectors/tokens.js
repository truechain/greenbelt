import { createSelector } from 'reselect'

export const selectedTokenAddressSelector = state => state.greenbelt.selectedTokenAddress
export const tokenSelector = state => state.greenbelt.tokens
export const selectedTokenSelector = createSelector(
  tokenSelector,
  selectedTokenAddressSelector,
  (tokens = [], selectedTokenAddress = '') => {
    return tokens.find(({ address }) => address === selectedTokenAddress)
  }
)
