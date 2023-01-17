import { TypedEvent } from '@photo-sphere-viewer/core';
import type { GalleryPlugin } from './GalleryPlugin';

/**
 * @event Triggered when the gallery shown
 */
export class ShowGalleryEvent extends TypedEvent<GalleryPlugin> {
    static override readonly type = 'show-gallery';
    override type: 'show-gallery';

    constructor() {
        super(ShowGalleryEvent.type);
    }
}

/**
 * @event Triggered when the gallery hidden
 */
export class HideGalleryEvent extends TypedEvent<GalleryPlugin> {
    static override readonly type = 'hide-gallery';
    override type: 'hide-gallery';

    constructor() {
        super(ShowGalleryEvent.type);
    }
}

export type GalleryPluginEvents = ShowGalleryEvent | HideGalleryEvent;
