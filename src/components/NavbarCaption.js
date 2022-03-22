import { DescriptionButton } from '../buttons/DescriptionButton';
import { AbstractComponent } from './AbstractComponent';

/**
 * @summary Navbar caption class
 * @extends PSV.components.AbstractComponent
 * @memberof PSV.components
 */
export class NavbarCaption extends AbstractComponent {

  static id = 'caption';

  /**
   * @param {PSV.components.Navbar} navbar
   * @param {string} caption
   */
  constructor(navbar, caption) {
    super(navbar, 'psv-caption');

    /**
     * @override
     * @property {string} id
     * @property {boolean} collapsable
     * @property {number} width
     * @property {string} caption
     * @property {boolean} contentVisible - if the content is visible in the navbar
     * @property {number} contentWidth - with of the caption content
     */
    this.prop = {
      ...this.prop,
      id            : this.constructor.id,
      collapsable   : false,
      width         : 0,
      caption       : '',
      contentVisible: true,
      contentWidth  : 0,
    };

    /**
     * @member {HTMLElement}
     * @readonly
     * @private
     */
    this.content = document.createElement('div');
    this.content.className = 'psv-caption-content';
    this.container.appendChild(this.content);

    this.setCaption(caption);
  }

  /**
   * @override
   */
  destroy() {
    delete this.content;

    super.destroy();
  }

  /**
   * @summary Sets the bar caption
   * @param {string} html
   */
  setCaption(html) {
    this.prop.caption = html || '';
    this.content.innerHTML = this.prop.caption;

    if (html) {
      this.prop.contentWidth = this.content.offsetWidth;
      this.refreshUi('caption change');
    }
    else if (!this.prop.contentVisible) {
      this.prop.contentVisible = true;
      this.__refreshButton();
    }
  }

  /**
   * @summary Toggles content and icon depending on available space
   * @private
   */
  refreshUi() {
    const availableWidth = this.container.offsetWidth;
    if (availableWidth >= this.prop.contentWidth && !this.prop.contentVisible) {
      this.content.style.display = '';
      this.prop.contentVisible = true;
    }
    else if (availableWidth < this.prop.contentWidth && this.prop.contentVisible) {
      this.content.style.display = 'none';
      this.prop.contentVisible = false;
    }
    this.__refreshButton();
  }

  /**
   * @private
   */
  __refreshButton() {
    this.psv.navbar.getButton(DescriptionButton.id, false)?.refreshUi(true);
  }

}
