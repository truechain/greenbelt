import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class InfoTab extends PureComponent {
  state = {
    version: global.platform.getVersion(),
  }

  static propTypes = {
    tab: PropTypes.string,
    greenbelt: PropTypes.object,
    setCurrentCurrency: PropTypes.func,
    setRpcTarget: PropTypes.func,
    displayWarning: PropTypes.func,
    revealSeedConfirmation: PropTypes.func,
    warning: PropTypes.string,
    location: PropTypes.object,
    history: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderInfoLinks () {
    const { t } = this.context

    return (
      <div className="settings-page__content-item settings-page__content-item--without-height">
        <div className="info-tab__link-header">
          { t('links') }
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://www.truechain.pro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('visitWebSite') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://www.truescan.net/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('visitTrueScan') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://stellar.truechain.pro/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('visitStellar') }
            </span>
          </a>
        </div>
        {/* <div className="info-tab__link-item">
          <a
            href="https://greenbelt.io/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('privacyMsg') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://greenbelt.io/terms.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('terms') }
            </span>
          </a>
        </div>
        <div className="info-tab__link-item">
          <a
            href="https://greenbelt.io/attributions.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('attributions') }
            </span>
          </a>
        </div> */}
        <hr className="info-tab__separator" />
        {/* <div className="info-tab__link-item">
          <a
            href="https://support.greenbelt.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('supportCenter') }
            </span>
          </a>
        </div> */}
        <div className="info-tab__link-item">
          <span>{ t('visitGreenbelt_before') }</span>
          <a
            href="https://greenbelt.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('visitGreenbelt') }
            </span>
          </a>
          <span>{ t('visitGreenbelt_after') }</span>
        </div>
        {/* <div className="info-tab__link-item">
          <a
            href="mailto:help@greenbelt.io?subject=Feedback"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="info-tab__link-text">
              { t('emailUs') }
            </span>
          </a>
        </div> */}
      </div>
    )
  }

  render () {
    const { t } = this.context

    return (
      <div className="settings-page__content">
        <div className="settings-page__content-row">
          <div className="settings-page__content-item settings-page__content-item--without-height">
            <div className="info-tab__logo-wrapper">
              <img
                src="images/info-logo.png"
                className="info-tab__logo"
              />
            </div>
            <div className="info-tab__item">
              <div className="info-tab__version-header">
                { t('greenbeltVersion') }
              </div>
              <div className="info-tab__version-number">
                { this.state.version }
              </div>
            </div>
            <div className="info-tab__item">
              <div className="info-tab__about">
                { t('builtInCalifornia') }
              </div>
            </div>
          </div>
          { this.renderInfoLinks() }
        </div>
      </div>
    )
  }
}
