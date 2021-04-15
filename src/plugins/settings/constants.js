import check from './check.svg';
import chevron from './chevron.svg';
import switchOff from './switch-off.svg';
import switchOn from './switch-on.svg';

/**
 * @summary Available events
 * @enum {string}
 * @memberof PSV.plugins.ResolutionPlugin
 * @constant
 */
export const EVENTS = {
  /**
   * @event setting-changed
   * @memberof PSV.plugins.SettingsPlugin
   * @summary Triggered when a setting is changed
   * @param {string} settingId
   * @param {any} value
   */
  SETTING_CHANGED: 'setting-changed',
};


/**
 * @summary Panel identifier for settings content
 * @type {string}
 * @constant
 * @private
 */
export const ID_PANEL = 'settings';

/**
 * @summary Property name added to settings items
 * @type {string}
 * @constant
 * @private
 */
export const SETTING_DATA = 'settingId';

/**
 * @summary Setting item template, by type
 * @constant
 * @private
 */
export const SETTINGS_TEMPLATE_ = {
  options: (setting, optionsCurrent) => `
      <span class="psv-settings-item-label">${setting.label}</span>
      <span class="psv-settings-item-value">${optionsCurrent(setting)}</span>
      <span class="psv-settings-item-icon">${chevron}</span>
    `,
  toggle : setting => `
      <span class="psv-settings-item-label">${setting.label}</span>
      <span class="psv-settings-item-value">${setting.active() ? switchOn : switchOff}</span>
    `,
};

/**
 * @summary Settings list template
 * @param {PSV.plugins.SettingsPlugin.Setting[]} settings
 * @param {string} dataKey
 * @param {function} optionsCurrent
 * @returns {string}
 * @constant
 * @private
 */
export const SETTINGS_TEMPLATE = (settings, dataKey, optionsCurrent) => `
<div class="psv-panel-menu psv-settings-menu">
  <ul class="psv-panel-menu-list">
    ${settings.map(s => `
      <li class="psv-panel-menu-item" data-${dataKey}="${s.id}">
        ${SETTINGS_TEMPLATE_[s.type](s, optionsCurrent)}
      </li>
    `).join('')}
  </ul>
</div>
`;

/**
 * @summary Settings options template
 * @param {PSV.plugins.SettingsPlugin.OptionsSetting} setting
 * @param {string} dataKey
 * @param {function} optionActive
 * @returns {string}
 * @constant
 * @private
 */
export const SETTING_OPTIONS_TEMPLATE = (setting, dataKey, optionActive) => `
<div class="psv-panel-menu psv-settings-menu">
  <ul class="psv-panel-menu-list">
    <li class="psv-panel-menu-item psv-settings-item--header" data-${dataKey}="__back">
      <span class="psv-settings-item-icon">${chevron}</span>
      <span class="psv-settings-item-label">${setting.label}</span>
    </li>
    ${setting.options().map(s => `
      <li class="psv-panel-menu-item" data-${dataKey}="${s.id}">
        <span class="psv-settings-item-icon">${optionActive(s) ? check : ''}</span>
        <span class="psv-settings-item-value">${s.label}</span>
      </li>
    `).join('')}
  </ul>
</div>
`;
