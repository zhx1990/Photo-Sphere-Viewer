import { AbstractButton } from './AbstractButton';
import download from '../icons/download.svg';

/**
 * @summary Navigation bar download button class
 * @extends PSV.buttons.AbstractButton
 * @memberof PSV.buttons
 */
export class DownloadButton extends AbstractButton {

  static id = 'download';
  static icon = download;

  /**
   * @param {PSV.components.Navbar} navbar
   */
  constructor(navbar) {
    super(navbar, 'psv-button--hover-scale psv-download-button', true);
  }

  /**
   * @override
   */
  isSupported() {
    return this.psv.adapter.constructor.supportsDownload || !!this.psv.config.downloadUrl;
  }

  /**
   * @override
   * @description Asks the browser to download the panorama source file
   */
  onClick() {
    const link = document.createElement('a');
    link.href = this.psv.config.downloadUrl || this.psv.config.panorama;
    link.download = link.href.split('/').pop();
    this.psv.container.appendChild(link);
    link.click();

    setTimeout(() => {
      this.psv.container.removeChild(link);
    }, 100);
  }

}
