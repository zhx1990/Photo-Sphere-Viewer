import { utils } from '@photo-sphere-viewer/core';
import check from './icons/check.svg';
import chevron from './icons/chevron.svg';
import switchOff from './icons/switch-off.svg';
import switchOn from './icons/switch-on.svg';
import { OptionsSetting, BaseSetting, SettingOption, ToggleSetting } from './model';

export const LOCAL_STORAGE_KEY = 'psvSettings';
export const ID_PANEL = 'settings';
export const SETTING_DATA = 'settingId';
export const OPTION_DATA = 'optionId';
export const ID_BACK = '__back';
export const ID_ENTER = '__enter';
export const SETTING_DATA_KEY = utils.dasherize(SETTING_DATA);
export const OPTION_DATA_KEY = utils.dasherize(OPTION_DATA);

/**
 * Setting item template, by type
 */
export const SETTINGS_TEMPLATE_: Record<BaseSetting['type'], any> = {
    options: (setting: OptionsSetting, optionsCurrent: (s: OptionsSetting) => string) => `
<span class="psv-settings-item-label">${setting.label}</span>
<span class="psv-settings-item-value">${optionsCurrent(setting)}</span>
<span class="psv-settings-item-icon">${chevron}</span>
`,
    toggle: (setting: ToggleSetting) => `
<span class="psv-settings-item-label">${setting.label}</span>
<span class="psv-settings-item-value">${setting.active() ? switchOn : switchOff}</span>
`,
};

/**
 * Settings list template
 */
export const SETTINGS_TEMPLATE = (settings: BaseSetting[], optionsCurrent: (s: OptionsSetting) => string) => `
<ul class="psv-settings-list">
  ${settings.map((setting) => `
    <li class="psv-settings-item" tabindex="0"
        data-${SETTING_DATA_KEY}="${setting.id}" data-${OPTION_DATA_KEY}="${ID_ENTER}">
      ${SETTINGS_TEMPLATE_[setting.type](setting as OptionsSetting, optionsCurrent)}
    </li>
  `).join('')}
</ul>
`;

/**
 * Settings options template
 */
export const SETTING_OPTIONS_TEMPLATE = (setting: OptionsSetting, optionActive: (o: SettingOption) => boolean) => `
<ul class="psv-settings-list">
  <li class="psv-settings-item psv-settings-item--header" tabindex="0"
      data-${SETTING_DATA_KEY}="${setting.id}" data-${OPTION_DATA_KEY}="${ID_BACK}">
    <span class="psv-settings-item-icon">${chevron}</span>
    <span class="psv-settings-item-label">${setting.label}</span>
  </li>
  ${setting.options().map((option) => `
    <li class="psv-settings-item" tabindex="0"
        data-${SETTING_DATA_KEY}="${setting.id}" data-${OPTION_DATA_KEY}="${option.id}">
      <span class="psv-settings-item-icon">${optionActive(option) ? check : ''}</span>
      <span class="psv-settings-item-value">${option.label}</span>
    </li>
  `).join('')}
</ul>
`;
