import { AbstractPlugin, DEFAULTS, PSVError, registerButton, utils } from '../..';
import {
  EVENTS,
  ID_PANEL,
  SETTING_DATA,
  SETTING_OPTIONS_TEMPLATE,
  SETTINGS_TEMPLATE,
  SETTINGS_TEMPLATE_
} from './constants';
import { SettingsButton } from './SettingsButton';
import './style.scss';


/**
 * @typedef {Object} PSV.plugins.SettingsPlugin.Setting
 * @summary Description of a setting
 * @property {string} id - identifier of the setting
 * @property {string} label - label of the setting
 * @property {'options' | 'toggle'} type - type of the setting
 * @property {function} [badge] - function which returns the value of the button badge
 */

/**
 * @typedef {PSV.plugins.SettingsPlugin.Setting} PSV.plugins.SettingsPlugin.OptionsSetting
 * @summary Description of a 'options' setting
 * @property {'options'} type - type of the setting
 * @property {function} current - function which returns the current option id
 * @property {function} options - function which the possible options as an array of {@link PSV.plugins.SettingsPlugin.Option}
 * @property {function} apply - function called with the id of the selected option
 */

/**
 * @typedef {PSV.plugins.SettingsPlugin.Setting} PSV.plugins.SettingsPlugin.ToggleSetting
 * @summary Description of a 'toggle' setting
 * @property {'toggle'} type - type of the setting
 * @property {function} active - function which return whereas the setting is active or not
 * @property {function} toggle - function called when the setting is toggled
 */

/**
 * @typedef {Object} PSV.plugins.SettingsPlugin.Option
 * @summary Option of an 'option' setting
 * @property {string} id - identifier of the option
 * @property {string} label - label of the option
 */


// add settings button
DEFAULTS.lang[SettingsButton.id] = 'Settings';
registerButton(SettingsButton, 'fullscreen:left');


export { EVENTS } from './constants';


/**
 * @summary Adds a button to access various settings.
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class SettingsPlugin extends AbstractPlugin {

  static id = 'settings';

  static EVENTS = EVENTS;

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @type {PSV.plugins.SettingsPlugin.Setting[]}
     * @private
     */
    this.settings = [];
  }

  /**
   * @package
   */
  init() {
    super.init();

    // buttons are initialized just after plugins
    setTimeout(() => this.updateBadge());
  }

  /**
   * @package
   */
  destroy() {
    this.settings.length = 0;

    super.destroy();
  }

  /**
   * @summary Registers a new setting
   * @param {PSV.plugins.SettingsPlugin.Setting} setting
   */
  addSetting(setting) {
    if (!setting.id) {
      throw new PSVError('Missing setting id');
    }
    if (!setting.type) {
      throw new PSVError('Missing setting type');
    }
    if (!SETTINGS_TEMPLATE_[setting.type]) {
      throw new PSVError('Unsupported setting type');
    }

    if (setting.badge && this.settings.some(s => s.badge)) {
      utils.logWarn('More than one setting with a badge are declared, the result is unpredictable.');
    }

    this.settings.push(setting);

    if (this.psv.panel.prop.contentId === ID_PANEL) {
      this.showSettings();
    }

    this.updateBadge();
  }

  /**
   * @summary Removes a setting
   * @param {string} id
   */
  removeSetting(id) {
    const idx = this.settings.findIndex(setting => setting.id === id);
    if (idx !== -1) {
      this.settings.splice(idx, 1);

      if (this.psv.panel.prop.contentId === ID_PANEL) {
        this.showSettings();
      }

      this.updateBadge();
    }
  }

  /**
   * @summary Toggles the settings panel
   */
  toggleSettings() {
    if (this.psv.panel.prop.contentId === ID_PANEL) {
      this.hideSettings();
    }
    else {
      this.showSettings();
    }
  }

  /**
   * @summary Hides the settings panel
   */
  hideSettings() {
    this.psv.panel.hide(ID_PANEL);
  }

  /**
   * @summary Shows the settings panel
   */
  showSettings() {
    this.psv.panel.show({
      id          : ID_PANEL,
      content     : SETTINGS_TEMPLATE(
        this.settings,
        utils.dasherize(SETTING_DATA),
        (setting) => { // retrocompatibility with "current" returning a label
          const current = setting.current();
          const option = setting.options().find(opt => opt.id === current);
          return option?.label || current;
        }
      ),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const settingId = li ? li.dataset[SETTING_DATA] : undefined;
        const setting = this.settings.find(s => s.id === settingId);

        if (setting) {
          switch (setting.type) {
            case 'toggle':
              setting.toggle();
              this.trigger(EVENTS.SETTING_CHANGED, setting.id, setting.active());
              this.showSettings();
              this.updateBadge();
              break;

            case 'options':
              this.__showOptions(setting);
              break;

            default:
            // noop
          }
        }
      },
    });
  }

  /**
   * @summary Shows setting options panel
   * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
   * @private
   */
  __showOptions(setting) {
    const current = setting.current();

    this.psv.panel.show({
      id          : ID_PANEL,
      content     : SETTING_OPTIONS_TEMPLATE(
        setting,
        utils.dasherize(SETTING_DATA),
        (option) => { // retrocompatibility with options having an "active" flag
          return 'active' in option ? option.active : option.id === current;
        }
      ),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const optionId = li ? li.dataset[SETTING_DATA] : undefined;

        if (optionId === '__back') {
          this.showSettings();
        }
        else {
          setting.apply(optionId);
          this.trigger(EVENTS.SETTING_CHANGED, setting.id, setting.current());
          this.hideSettings();
          this.updateBadge();
        }
      },
    });
  }

  /**
   * @summary Updates the badge in the button
   */
  updateBadge() {
    const value = this.settings.find(s => s.badge)?.badge();
    this.psv.navbar.getButton(SettingsButton.id, false)?.setBadge(value);
  }

}
