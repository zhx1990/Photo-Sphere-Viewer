import { AbstractPlugin, events, Point, utils, Viewer } from '@photo-sphere-viewer/core';
import type { events as markersEvents, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { MapComponent } from './components/MapComponent';
import { HOTSPOT_GENERATED_ID } from './constants';
import { MapPluginEvents } from './events';
import compass from './icons/compass.svg';
import pin from './icons/pin.svg';
import spot from './icons/spot.svg';
import { MapHotspot, MapPluginConfig, ParsedMapPluginConfig } from './model';

const getConfig = utils.getConfigParser<MapPluginConfig, ParsedMapPluginConfig>(
    {
        imageUrl: null,
        center: null,
        rotation: 0,
        size: '200px',
        position: ['bottom', 'left'],
        visibleOnLoad: true,
        compassImage: compass,
        pinImage: pin,
        pinSize: 40,
        spotImage: spot,
        spotSize: 20,
        static: false,
        defaultZoom: 100,
        minZoom: 20,
        maxZoom: 200,
        hotspots: [],
    },
    {
        position: (position, { defValue }) => {
            return utils.cleanCssPosition(position, { allowCenter: false, cssOrder: true }) || defValue;
        },
        rotation: (rotation) => utils.parseAngle(rotation),
        defaultZoom: (defaultZoom) => Math.log(defaultZoom / 100),
        maxZoom: (maxZoom) => Math.log(maxZoom / 100),
        minZoom: (minZoom) => Math.log(minZoom / 100),
    }
);

/**
 * Adds a minimap on the viewer
 */
export class MapPlugin extends AbstractPlugin<MapPluginEvents> {
    static override readonly id = 'map';

    readonly config: ParsedMapPluginConfig;

    private markers?: MarkersPlugin;
    readonly component: MapComponent;

    constructor(viewer: Viewer, config: MapPluginConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.component = new MapComponent(this.viewer, this);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.markers = this.viewer.getPlugin('markers');

        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ReadyEvent.type, this, { once: true });

        this.setHotspots(this.config.hotspots, false);

        if (this.markers) {
            this.markers.addEventListener('set-markers', this);
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.SizeUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ReadyEvent.type, this);

        if (this.markers) {
            this.markers.removeEventListener('set-markers', this);
        }

        this.component.destroy();

        delete this.markers;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.ReadyEvent.type:
                this.show();
                break;
            case events.PositionUpdatedEvent.type:
                this.component.update();
                break;
            case events.SizeUpdatedEvent.type:
                if (this.component.maximized) {
                    this.component.update();
                }
                break;
            case 'set-markers':
                this.component.setMarkers((e as markersEvents.SetMarkersEvent).markers);
                break;
            default:
                break;
        }
    }

    /**
     * Hides the map
     */
    hide() {
        this.component.hide();
    }

    /**
     * Shows the map
     */
    show() {
        this.component.show();
    }

    /**
     * Changes the image of the map
     * @param rotation Also change the image rotation
     * @param center Also change the position on the map
     */
    setImage(url: string, center?: Point, rotation?: string | number) {
        if (!utils.isNil(rotation)) {
            this.config.rotation = utils.parseAngle(rotation);
        }
        if (!utils.isNil(center)) {
            this.config.center = center;
        }
        this.config.imageUrl = url;
        this.component.reload();
    }

    /**
     * Changes the position on the map
     */
    setCenter(center: Point) {
        this.config.center = center;
        this.component.recenter();
    }

    /**
     * Changes the hotspots on the map
     */
    setHotspots(hotspots: MapHotspot[], render = true) {
        const ids: string[] = [];
        let i = 1;

        hotspots?.forEach((hotspot) => {
            if (!hotspot.id) {
                hotspot.id = HOTSPOT_GENERATED_ID + i++;
            } else if (ids.includes(hotspot.id)) {
                utils.logWarn(`Duplicated hotspot id "${hotspot.id}`);
            } else {
                ids.push(hotspot.id);
            }
        });

        this.config.hotspots = hotspots || [];

        if (render) {
            this.component.update();
        }
    }

    /**
     * Removes all hotspots
     */
    clearHotspots() {
        this.setHotspots(null);
    }
}
