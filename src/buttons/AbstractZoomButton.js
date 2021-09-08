import { KEY_CODES } from '../data/constants';
import { SYSTEM } from '../data/system';
import { getEventKey } from '../utils';
import { PressHandler } from '../utils/PressHandler';
import { AbstractButton } from './AbstractButton';

/**
 * @summary Navigation bar zoom button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class AbstractZoomButton extends AbstractButton {

  /**
   * @param {PSV.components.Navbar} navbar
   * @param {number} value
   */
  constructor(navbar, value) {
    super(navbar, 'psv-button--hover-scale psv-zoom-button');

    /**
     * @override
     * @property {boolean} value
     * @property {PressHandler} handler
     */
    this.prop = {
      ...this.prop,
      value  : value,
      handler: new PressHandler(),
    };

    this.container.addEventListener('mousedown', this);
    this.container.addEventListener('keydown', this);
    this.container.addEventListener('keyup', this);
    this.psv.container.addEventListener('mouseup', this);
    this.psv.container.addEventListener('touchend', this);
  }

  /**
   * @override
   */
  destroy() {
    this.__onMouseUp();

    this.psv.container.removeEventListener('mouseup', this);
    this.psv.container.removeEventListener('touchend', this);

    super.destroy();
  }

  /**
   * @summary Handles events
   * @param {Event} e
   * @private
   */
  handleEvent(e) {
    /* eslint-disable */
    switch (e.type) {
      // @formatter:off
      case 'mousedown': this.__onMouseDown(); break;
      case 'mouseup':   this.__onMouseUp(); break;
      case 'touchend':  this.__onMouseUp(); break;
      case 'keydown':   getEventKey(e) === KEY_CODES.Enter && this.__onMouseDown(); break;
      case 'keyup':     getEventKey(e) === KEY_CODES.Enter && this.__onMouseUp(); break;
      // @formatter:on
    }
    /* eslint-enable */
  }

  /**
   * @override
   */
  isSupported() {
    return { initial: true, promise: SYSTEM.isTouchEnabled.then(enabled => !enabled) };
  }

  /**
   * @override
   */
  onClick() {
    // nothing
  }

  /**
   * @private
   */
  __onMouseDown() {
    if (!this.prop.enabled) {
      return;
    }

    this.psv.dynamics.zoom.roll(this.prop.value);
    this.prop.handler.down();
  }

  /**
   * @private
   */
  __onMouseUp() {
    if (!this.prop.enabled) {
      return;
    }

    this.prop.handler.up(() => this.psv.dynamics.zoom.stop());
  }

}
