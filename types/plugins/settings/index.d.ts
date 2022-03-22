import { Event } from 'uevent';
import { AbstractPlugin, Viewer } from '../..';

/**
 * @summary Description of a setting
 */
export type BaseSetting = {
  id: string;
  label: string;
  badge?: () => string;
};

/**
 * @summary Description of a 'options' setting
 */
export type OptionsSetting = BaseSetting & {
  type: 'options';
  current: () => string;
  options: () => SettingOption[]
  apply: (string) => void;
};

/**
 * @summary Description of a 'toggle' setting
 */
export type ToggleSetting = BaseSetting & {
  type: 'toggle';
  active: () => boolean;
  toggle: () => void;
};

/**
 * @summary Option of an 'option' setting
 */
export type SettingOption = {
  id: string;
  label: string;
};

export type Setting = OptionsSetting | ToggleSetting;

export const EVENTS: {
  SETTING_CHANGED: 'setting-changed',
};

/**
 * @summary Adds a button to access various settings.
 */
export class SettingsPlugin extends AbstractPlugin {

  static EVENTS: typeof EVENTS;

  constructor(psv: Viewer);

  /**
   * @summary Registers a new setting
   */
  addSetting(setting: Setting);

  /**
   * @summary Removes a setting
   * @param {string} id
   */
  removeSetting(id: string);

  /**
   * @summary Toggles the settings panel
   */
  toggleSettings();

  /**
   * @summary Hides the settings panel
   */
  hideSettings();

  /**
   * @summary Shows the settings panel
   */
  showSettings();

  /**
   * @summary Triggered when a setting is changed
   */
  on(e: 'setting-changed', cb: (e: Event, settingId: string, value: any) => void): this;

}
