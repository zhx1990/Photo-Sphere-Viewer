import { utils } from '../..';

/**
 * @summary Available events
 * @enum {string}
 * @memberof PSV.plugins.GalleryPlugin
 * @constant
 */
export const EVENTS = {
  /**
   * @event show-gallery
   * @memberof PSV.plugins.GalleryPlugin
   * @summary Triggered when the gallery is shown
   */
  SHOW_GALLERY: 'show-gallery',
  /**
   * @event hide-gallery
   * @memberof PSV.plugins.GalleryPlugin
   * @summary Triggered when the gallery is hidden
   */
  HIDE_GALLERY: 'hide-gallery',
};

export const GALLERY_ITEM_DATA = 'psvGalleryItem';
export const GALLERY_ITEM_DATA_KEY = utils.dasherize(GALLERY_ITEM_DATA);

export const ITEMS_TEMPLATE = (items, dataKey, size) => `
<div class="psv-gallery-container">
  ${items.map(item => `
  <div class="psv-gallery-item" data-${dataKey}="${item.id}" ${size ? `style="width:${size.width}px;height:${size.height}px"` : ''}>
    ${item.name ? `<div class="psv-gallery-item-title"><span>${item.name}</span></div>` : ''}
    <svg class="psv-gallery-item-thumb" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><use href="#psvGalleryBlankIcon"></use></svg>
    ${item.thumbnail ? `<div class="psv-gallery-item-thumb" data-src="${item.thumbnail}"></div>` : ''}
  </div>
  `).join('')}
</div>
`;
