import type { Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, CONSTANTS, utils } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { Control, DivIcon, Icon, Layer, Map, Marker, TileLayer } from 'leaflet';
import type { PlanPlugin } from '../PlanPlugin';
import { HOTSPOT_MARKER_ID, OSM_ATTRIBUTION, OSM_LABEL, OSM_URL } from '../constants';
import { SelectHotspot } from '../events';
import { PlanHotspot } from '../model';
import { createLeafletIcon, getStyle, gpsToLeaflet } from '../utils';
import { PlanCloseButton } from './PlanCloseButton';
import { PlanMaximizeButton } from './PlanMaximizeButton';
import { PlanResetButton } from './PlanResetButton';
import { PlanLayersButton } from './PlanLayersButton';

export class PlanComponent extends AbstractComponent {
    protected override readonly state = {
        visible: false,
        maximized: false,
        collapsed: false,

        layers: {} as Record<string, Layer>,
        pinMarker: null as Marker,
        hotspots: {} as Record<string, {
            hotspot: PlanHotspot;
            marker: Marker;
            isMarker: boolean;
        }>,
        hotspotId: null as string,

        forceRender: false,
        needsUpdate: false,
        renderLoop: null as ReturnType<typeof requestAnimationFrame>,
    };

    public readonly map: Map;
    private readonly resetButton: PlanResetButton;
    private readonly closeButton: PlanCloseButton;
    private readonly maximizeButton: PlanMaximizeButton;
    private readonly layersButton: PlanLayersButton;

    get config() {
        return this.plugin.config;
    }

    get maximized() {
        return this.state.maximized;
    }

    get collapsed() {
        return this.state.collapsed;
    }

    constructor(
        viewer: Viewer,
        private plugin: PlanPlugin
    ) {
        super(viewer, {
            className: `psv-plan ${CONSTANTS.CAPTURE_EVENTS_CLASS}`,
        });

        const mapContainer = document.createElement('div');
        mapContainer.className = 'psv-plan__container';

        this.map = new Map(mapContainer, {
            attributionControl: false,
            zoomControl: false,
        });
        new Control.Attribution({ prefix: false }).addTo(this.map);

        this.container.appendChild(mapContainer);

        this.container.addEventListener('transitionstart', this);
        this.container.addEventListener('transitionend', this);

        // sub-components
        this.layersButton = new PlanLayersButton(this);
        if (this.config.buttons.reset) {
            this.resetButton = new PlanResetButton(this);
        }
        if (this.config.buttons.maximize) {
            this.maximizeButton = new PlanMaximizeButton(this);
        }
        if (this.config.buttons.close) {
            this.closeButton = new PlanCloseButton(this);
        }

        // render loop
        const renderLoop = () => {
            if (this.isVisible() && (this.state.needsUpdate || this.state.forceRender)) {
                this.map?.invalidateSize();
                this.state.needsUpdate = false;
            }
            this.state.renderLoop = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        this.applyConfig();
        this.hide();

        if (!this.config.visibleOnLoad) {
            this.toggleCollapse();
        }

        if (this.config.configureLeaflet) {
            this.config.configureLeaflet(this.map);
        } else {
            this.state.layers = this.config.layers.reduce((acc, layer, i) => {
                if (!layer.name) {
                    layer.name = `Layer ${i+1}`;
                }

                if (layer.urlTemplate) {
                    acc[layer.name] = new TileLayer(layer.urlTemplate, { attribution: layer.attribution });
                } else if (layer.layer) {
                    if (layer.attribution) {
                        layer.layer.options.attribution = layer.attribution;
                    }
                    acc[layer.name] = layer.layer;
                } else {
                    utils.logWarn(`Layer #${i} is missing "urlTemplate" or "layer" property.`);
                }
                return acc;
            }, {} as Record<string, Layer>);

            if (!Object.values(this.state.layers).length) {
                utils.logWarn(`No layer configured, fallback to OSM.`);
                this.state.layers[OSM_LABEL] = new TileLayer(OSM_URL, { attribution: OSM_ATTRIBUTION });
            }

            const layersNames = Object.keys(this.state.layers);

            this.setLayer(layersNames[0]);

            if (layersNames.length > 1) {
                this.layersButton.setLayers(layersNames);
            }
        }

        this.map.fitWorld();

        if (this.config.coordinates) {
            this.recenter();
        }
    }

    override destroy(): void {
        cancelAnimationFrame(this.state.renderLoop);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (utils.getClosest(e.target as HTMLElement, `.${CONSTANTS.CAPTURE_EVENTS_CLASS}:not(.psv-plan)`)) {
            return;
        }
        switch (e.type) {
            case 'transitionstart':
                this.state.forceRender = true;
                break;
            case 'transitionend':
                this.state.forceRender = false;
                break;
        }
    }

    applyConfig() {
        this.container.classList.remove(
            'psv-plan--top-right',
            'psv-plan--top-left',
            'psv-plan--bottom-right',
            'psv-plan--bottom-left'
        );
        this.container.classList.add(`psv-plan--${this.config.position.join('-')}`);

        this.container.style.width = this.config.size.width;
        this.container.style.height = this.config.size.height;

        this.layersButton.applyConfig();
        this.resetButton?.applyConfig();
        this.closeButton?.applyConfig();
        this.maximizeButton?.applyConfig();

        this.state.needsUpdate = true;
    }

    override isVisible(): boolean {
        return this.state.visible && !this.state.collapsed;
    }

    override show() {
        super.show();
        this.state.needsUpdate = true;
    }

    override hide() {
        super.hide();
        this.state.forceRender = false;
    }

    /**
     * Changes the base layer
     */
    setLayer(name: string) {
        Object.values(this.state.layers).forEach((layer) => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });

        this.map.addLayer(this.state.layers[name]);
    }

    /**
     * Resets the map position and zoom level
     */
    reset() {
        this.map.setView(gpsToLeaflet(this.config.coordinates), this.config.defaultZoom);
    }

    /**
     * Moves the position min and resets the map position
     */
    recenter() {
        const pos = gpsToLeaflet(this.config.coordinates);

        if (!this.state.pinMarker) {
            const icon = createLeafletIcon(this.config.pinImage, this.config.pinSize);

            this.state.pinMarker = new Marker(pos, {
                icon,
                alt: '',
            }).addTo(this.map);
        } else {
            this.state.pinMarker.setLatLng(pos);
        }

        if (this.map.getZoom() < 10) {
            this.reset();
        } else {
            this.map.setView(pos);
        }
    }

    /**
     * Switch collapsed mode
     */
    toggleCollapse() {
        if (this.state.maximized) {
            this.toggleMaximized();
        }

        this.state.collapsed = !this.state.collapsed;

        utils.toggleClass(this.container, 'psv-plan--collapsed', this.state.collapsed);

        if (!this.state.collapsed && this.map) {
            this.reset();
        }

        this.closeButton?.update();
    }

    /**
     * Switch maximized mode
     */
    toggleMaximized() {
        if (this.state.collapsed) {
            return;
        }

        this.state.maximized = !this.state.maximized;

        utils.toggleClass(this.container, 'psv-plan--maximized', this.state.maximized);

        this.maximizeButton?.update();
    }

    /**
     * Changes the zoom level
     */
    zoom(d: number) {
        this.map.setZoom(d);
    }

    /**
     * Updates the markers
     */
    setMarkers(markers: PlanHotspot[]) {
        this.__setHotspots(markers, true);
    }

    /**
     * Changes the highlighted hotspot
     */
    setActiveHotspot(hotspotId: string) {
        if (this.state.hotspotId) {
            this.__applyStyle(this.state.hotspotId, false);
        }

        if (hotspotId) {
            this.__applyStyle(hotspotId, true);
        }

        this.state.hotspotId = hotspotId;
    }

    /**
     * Changes the hotspots
     */
    setHotspots(hotspots: PlanHotspot[]) {
        this.__setHotspots(hotspots, false);
    }

    private __setHotspots(hotspots: PlanHotspot[], isMarkers: boolean) {
        Object.entries(this.state.hotspots)
            .filter(([, { isMarker }]) => isMarker === isMarkers)
            .forEach(([id, { marker }]) => {
                marker.off();
                marker.remove();
                delete this.state.hotspots[id];
            });

        hotspots.forEach((hotspot) => {
            const style = getStyle(this.config.spotStyle, hotspot, false);

            let icon: Icon<any>;
            if (style.image) {
                icon = createLeafletIcon(style.image, style.size);
            } else {
                icon = new DivIcon({ html: '', className: 'psv-plan__spot' });
            }

            const marker = new Marker(gpsToLeaflet(hotspot.coordinates), {
                icon,
                alt: '',
            }).addTo(this.map);

            if (hotspot.tooltip) {
                if (typeof hotspot.tooltip === 'string') {
                    hotspot.tooltip = { content: hotspot.tooltip };
                }

                marker.bindTooltip(hotspot.tooltip.content, {
                    className: hotspot.tooltip.className,
                    direction: 'top',
                    offset: [0, -style.size / 2],
                });
            }

            marker.on('click', () => this.__clickHotspot(hotspot.id));
            marker.on('mouseover', () => this.setActiveHotspot(hotspot.id));
            marker.on('mouseout', () => this.setActiveHotspot(null));

            this.state.hotspots[hotspot.id] = { hotspot, marker, isMarker: isMarkers };

            this.__applyStyle(hotspot.id, false);
        });
    }

    /**
     * Updates the style of a map marker
     */
    private __applyStyle(hotspotId: string, hover: boolean) {
        const hotspot = this.state.hotspots[hotspotId]?.hotspot;
        const element = this.state.hotspots[hotspotId]?.marker.getElement();

        if (!hotspot) {
            return;
        }

        const style = getStyle(this.config.spotStyle, hotspot, hover);

        element.style.width = style.size + 'px';
        element.style.height = style.size + 'px';
        element.style.marginTop = (-style.size / 2) + 'px';
        element.style.marginLeft = (-style.size / 2) + 'px';

        if (element.tagName === 'DIV') {
            element.style.backgroundColor = style.color;
            element.style.outlineStyle = 'solid';
            element.style.outlineColor = style.borderColor;
            element.style.outlineWidth = style.borderSize + 'px';
        } else {
            (element as HTMLImageElement).src = style.image;
        }
    }

    /**
     * Dispatch event when a hotspot is clicked
     */
    private __clickHotspot(hotspotId: string) {
        this.plugin.dispatchEvent(new SelectHotspot(hotspotId));

        if (hotspotId.startsWith(HOTSPOT_MARKER_ID)) {
            const markerId = hotspotId.substring(HOTSPOT_MARKER_ID.length);
            this.viewer.getPlugin<MarkersPlugin>('markers').gotoMarker(markerId);
        }

        if (this.maximized) {
            this.toggleMaximized();
        }
    }

}
