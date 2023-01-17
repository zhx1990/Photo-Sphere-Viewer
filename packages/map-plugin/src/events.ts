import { TypedEvent } from '@photo-sphere-viewer/core';
import type { MapPlugin } from './MapPlugin';

/**
 * Triggered when the user clicks on a hotspot
 */
export class SelectHotspot extends TypedEvent<MapPlugin> {
    static override readonly type = 'select-hotspot';
    override type: 'select-hotspot';

    constructor(public readonly hotspotId: string) {
        super(SelectHotspot.type);
    }
}

export type MapPluginEvents = SelectHotspot;
