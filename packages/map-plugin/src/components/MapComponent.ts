import type { Point, Tooltip, Viewer } from '@photo-sphere-viewer/core';
import { AbstractComponent, SYSTEM, utils } from '@photo-sphere-viewer/core';
import type { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { MathUtils } from 'three';
import { HOTSPOT_MARKER_ID, MAP_SHADOW_BLUR, PIN_SHADOW_BLUR, PIN_SHADOW_OFFSET } from '../constants';
import { SelectHotspot } from '../events';
import type { MapPlugin } from '../MapPlugin';
import { MapHotspot } from '../model';
import { canvasShadow, drawImageCentered, drawImageHighDpi, getImageHtml, loadImage, projectPoint, unprojectPoint } from '../utils';
import { MapCloseButton } from './MapCloseButton';
import { MapMaximizeButton } from './MapMaximizeButton';
import { MapResetButton } from './MapResetButton';
import { MapZoomToolbar } from './MapZoomToolbar';

export class MapComponent extends AbstractComponent {
    protected override readonly state = {
        visible: false,
        maximized: false,
        collapsed: false,

        zoom: this.config.defaultZoom,
        offset: { x: 0, y: 0 } as Point,

        mouseX: null as number,
        mouseY: null as number,
        mousedown: false,
        pinchDist: 0,
        pinchAngle: 0,

        hotspotPos: {} as Record<string, Point>,
        hotspotId: null as string,
        hotspotTooltip: null as Tooltip,
        markers: [] as MapHotspot[],

        forceRender: false,
        needsUpdate: false,
        renderLoop: null as ReturnType<typeof requestAnimationFrame>,

        images: {} as Record<string, { loading: boolean; value: HTMLImageElement }>,
    };

    private readonly canvas: HTMLCanvasElement;
    private readonly compass: HTMLElement;
    private readonly resetButton: MapResetButton;
    private readonly maximizeButton: MapMaximizeButton;
    private readonly closeButton: MapCloseButton;
    private readonly zoomToolbar: MapZoomToolbar;

    get config() {
        return this.plugin.config;
    }

    get maximized() {
        return this.state.maximized;
    }

    get collapsed() {
        return this.state.collapsed;
    }

    constructor(viewer: Viewer, private plugin: MapPlugin) {
        super(viewer, {
            className: `psv-map psv--capture-event`,
        });

        // map + compass container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'psv-map__container';

        canvasContainer.addEventListener('mousedown', this);
        window.addEventListener('mousemove', this);
        window.addEventListener('mouseup', this);
        canvasContainer.addEventListener('touchstart', this);
        window.addEventListener('touchmove', this);
        window.addEventListener('touchend', this);
        canvasContainer.addEventListener('wheel', this);

        // map canvas
        this.canvas = document.createElement('canvas');
        canvasContainer.appendChild(this.canvas);

        // compass
        this.compass = document.createElement('div');
        this.compass.className = 'psv-map__compass';
        canvasContainer.appendChild(this.compass);

        this.container.appendChild(canvasContainer);

        this.container.addEventListener('transitionstart', this);
        this.container.addEventListener('transitionend', this);

        // sub-components
        this.resetButton = new MapResetButton(this);
        this.maximizeButton = new MapMaximizeButton(this);
        this.closeButton = new MapCloseButton(this);
        this.zoomToolbar = new MapZoomToolbar(this);

        // render loop
        const renderLoop = () => {
            if (this.isVisible() && (this.state.needsUpdate || this.state.forceRender)) {
                this.render();
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
    }

    override destroy(): void {
        window.removeEventListener('touchmove', this);
        window.removeEventListener('mousemove', this);
        window.removeEventListener('touchend', this);
        window.removeEventListener('mouseup', this);

        cancelAnimationFrame(this.state.renderLoop);

        super.destroy();
    }

    handleEvent(e: Event) {
        switch (e.type) {
            case 'mousedown': {
                const event = e as MouseEvent;
                this.state.mouseX = event.clientX;
                this.state.mouseY = event.clientY;
                this.state.mousedown = true;
                e.stopPropagation();
                break;
            }
            case 'touchstart': {
                const event = e as TouchEvent;
                if (event.touches.length === 1) {
                    this.state.mouseX = event.touches[0].clientX;
                    this.state.mouseY = event.touches[0].clientY;
                    this.state.mousedown = true;
                } else if (event.touches.length === 2) {
                    ({
                        distance: this.state.pinchDist,
                        angle: this.state.pinchAngle,
                        center: { x: this.state.mouseX, y: this.state.mouseY },
                    } = utils.getTouchData(event));
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            }
            case 'mousemove': {
                const event = e as MouseEvent;
                if (this.state.mousedown) {
                    this.__move(event.clientX, event.clientY);
                    e.stopPropagation();
                } else {
                    this.__handleHotspots(event.clientX, event.clientY);
                }
                break;
            }
            case 'touchmove': {
                const event = e as TouchEvent;
                if (this.state.mousedown && event.touches.length === 1) {
                    this.__move(event.touches[0].clientX, event.touches[0].clientY);
                    e.stopPropagation();
                } else if (this.state.mousedown && event.touches.length === 2) {
                    const touchData = utils.getTouchData(event);
                    const delta = (touchData.distance - this.state.pinchDist) / SYSTEM.pixelRatio;

                    this.zoom(delta / 100);
                    this.__move(touchData.center.x, touchData.center.y);

                    if (this.state.maximized && !this.config.static) {
                        this.viewer.dynamics.position.step({ yaw: this.state.pinchAngle - touchData.angle }, 0);
                    }

                    ({
                        distance: this.state.pinchDist,
                        angle: this.state.pinchAngle,
                    } = touchData);
                    e.stopPropagation();
                }
                break;
            }
            case 'mouseup':
            case 'touchend': {
                const mouse = (e as TouchEvent).changedTouches?.[0] || (e as MouseEvent);
                if (this.state.mousedown) {
                    this.state.mousedown = false;
                    e.stopPropagation();
                }
                this.__clickHotspot(mouse.clientX, mouse.clientY);
                break;
            }
            case 'wheel': {
                const event = e as WheelEvent;
                const delta = event.deltaY / Math.abs(event.deltaY);
                this.zoom(-delta / 10);
                e.stopPropagation();
                e.preventDefault();
                break;
            }
            case 'transitionstart':
                this.state.forceRender = true;
                break;
            case 'transitionend':
                if (!this.state.maximized && this.compass) {
                    this.compass.style.display = '';
                }
                this.state.forceRender = false;
                this.update();
                break;
            default:
                break;
        }
    }

    applyConfig() {
        this.container.classList.remove(
            'psv-map--top-right',
            'psv-map--top-left',
            'psv-map--bottom-right',
            'psv-map--bottom-left'
        );
        this.container.classList.add(`psv-map--${this.config.position.join('-')}`);

        this.container.style.width = this.config.size;
        this.container.style.height = this.config.size;

        this.compass.innerHTML = getImageHtml(this.config.compassImage);

        this.resetButton.applyConfig();
        this.closeButton.applyConfig();
        this.maximizeButton.applyConfig();

        this.update();
    }

    override show(): void {
        super.show();
        this.update();
    }

    /**
     * Flag for render
     */
    update() {
        this.state.needsUpdate = true;
    }

    /**
     * Clears the map image and offset
     */
    reload() {
        delete this.state.images[this.config.imageUrl];
        this.recenter();
    }

    /**
     * Clears the offset and zoom level
     */
    reset() {
        this.state.zoom = this.config.defaultZoom;
        this.recenter();
    }

    /**
     * Clears the offset
     */
    recenter() {
        this.state.offset.x = 0;
        this.state.offset.y = 0;
        this.update();
    }

    /**
     * Switch collapsed mode
     */
    toggleCollapse() {
        if (this.state.maximized) {
            this.toggleMaximized();
        }

        this.state.collapsed = !this.state.collapsed;

        utils.toggleClass(this.container, 'psv-map--collapsed', this.state.collapsed);

        if (!this.state.collapsed) {
            this.reset();
        }

        this.closeButton.update();
    }

    /**
     * Switch maximized mode
     */
    toggleMaximized() {
        if (this.state.collapsed) {
            return;
        }

        this.state.maximized = !this.state.maximized;

        utils.toggleClass(this.container, 'psv-map--maximized', this.state.maximized);

        if (this.state.maximized && this.compass) {
            this.compass.style.display = 'none';
        }

        this.maximizeButton.update();
    }

    /**
     * Changes the zoom level
     */
    zoom(d: number) {
        this.state.zoom = MathUtils.clamp(this.state.zoom + d, this.config.minZoom, this.config.maxZoom);
        this.update();
    }

    /**
     * Updates the markers
     */
    setMarkers(markers: MapHotspot[]) {
        this.state.markers = markers;
        this.update();
    }

    private render() {
        // load the map image
        const mapImage = this.__loadImage(this.config.imageUrl);
        if (!mapImage) {
            return;
        }

        // clear hotspots status
        this.state.hotspotPos = {};
        this.__resetHotspot();

        const yaw = this.viewer.getPosition().yaw;
        const zoom = Math.exp(this.state.zoom);
        const center = this.config.center;
        const offset = this.state.offset;
        const rotation = this.config.rotation;
        const yawAndRotation = this.config.static ? 0 : yaw + rotation;

        // update UI
        if (this.compass && !this.config.static) {
            this.compass.style.transform = `rotate(${-MathUtils.radToDeg(yawAndRotation)}deg)`;
        }
        this.zoomToolbar.setText(zoom);

        // clear canvas
        this.canvas.width = this.container.clientWidth * SYSTEM.pixelRatio;
        this.canvas.height = this.container.clientHeight * SYSTEM.pixelRatio;

        const canvasPos = utils.getPosition(this.canvas);
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        const canvasVirtualCenterX = canvasW / 2 / SYSTEM.pixelRatio;
        const canvasVirtualCenterY = canvasH / 2 / SYSTEM.pixelRatio;

        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, canvasW, canvasH);

        // draw the map
        const mapW = mapImage.width;
        const mapH = mapImage.height;

        context.save();
        context.translate(canvasW / 2, canvasH / 2);
        context.rotate(-yawAndRotation);
        context.scale(zoom, zoom);
        canvasShadow(context, 0, 0, MAP_SHADOW_BLUR);
        // prettier-ignore
        drawImageHighDpi(
            context,
            mapImage,
            -center.x - offset.x,
            -center.y - offset.y,
            mapW,
            mapH
        );
        context.restore();

        // draw the hotspots
        [...this.config.hotspots, ...this.state.markers].forEach((hotspot: MapHotspot) => {
            const image = this.__loadImage(hotspot.image || this.config.spotImage);

            const hotspotPos = { ...offset };
            if ('yaw' in hotspot && 'distance' in hotspot) {
                const angle = utils.parseAngle(hotspot.yaw) + rotation;
                hotspotPos.x += Math.sin(-angle) * hotspot.distance;
                hotspotPos.y += Math.cos(-angle) * hotspot.distance;
            } else if ('x' in hotspot && 'y' in hotspot) {
                hotspotPos.x += center.x - hotspot.x;
                hotspotPos.y += center.y - hotspot.y;
            } else {
                utils.logWarn(`Hotspot ${hotspot['id']} is missing position (yaw+distance or x+y)`);
                return;
            }

            const spotPos = projectPoint(hotspotPos, yawAndRotation, zoom);

            // save absolute position on the viewer
            this.state.hotspotPos[hotspot.id] = {
                x: canvasVirtualCenterX - spotPos.x + canvasPos.x,
                y: canvasVirtualCenterY - spotPos.y + canvasPos.y,
            };

            const x = canvasVirtualCenterX - spotPos.x;
            const y = canvasVirtualCenterY - spotPos.y;
            const size = hotspot.size || this.config.spotSize;

            context.save();
            context.translate(x * SYSTEM.pixelRatio, y * SYSTEM.pixelRatio);
            canvasShadow(context, PIN_SHADOW_OFFSET, PIN_SHADOW_OFFSET, PIN_SHADOW_BLUR);
            if (image) {
                drawImageCentered(context, image, size);
            } else {
                context.fillStyle = hotspot.color || this.config.spotColor;
                context.beginPath();
                context.arc(0, 0, size * SYSTEM.pixelRatio / 2, 0, 2 * Math.PI);
                context.fill();
            }
            context.restore();
        });

        // draw the pin
        const pinImage = this.__loadImage(this.config.pinImage);
        if (pinImage) {
            const pinPos = projectPoint(offset, yawAndRotation, zoom);

            const x = canvasVirtualCenterX - pinPos.x;
            const y = canvasVirtualCenterY - pinPos.y;
            const size = this.config.pinSize;
            const angle = this.config.static ? yaw + rotation : 0;

            context.save();
            context.translate(x * SYSTEM.pixelRatio, y * SYSTEM.pixelRatio);
            context.rotate(angle);
            canvasShadow(context, PIN_SHADOW_OFFSET, PIN_SHADOW_OFFSET, PIN_SHADOW_BLUR);
            drawImageCentered(context, pinImage, size);
            context.restore();
        }
    }

    /**
     * Applies mouse movement to the map
     */
    private __move(clientX: number, clientY: number) {
        const yaw = this.viewer.getPosition().yaw;
        const zoom = Math.exp(this.state.zoom);

        const move = unprojectPoint(
            {
                x: this.state.mouseX - clientX,
                y: this.state.mouseY - clientY,
            },
            this.config.static ? 0 : yaw + this.config.rotation,
            zoom
        );

        this.state.offset.x += move.x;
        this.state.offset.y += move.y;

        this.update();

        this.state.mouseX = clientX;
        this.state.mouseY = clientY;
    }

    /**
     * Finds the hotspot under the mouse
     */
    private __findHotspot(clientX: number, clientY: number): string {
        const k = this.config.spotSize / 2;

        let hotspotId: string = null;
        for (const [id, { x, y }] of Object.entries(this.state.hotspotPos)) {
            if (clientX > x - k && clientX < x + k && clientY > y - k && clientY < y + k) {
                hotspotId = id;
                break;
            }
        }

        return hotspotId;
    }

    /**
     * Updates current hotspot on mouse move and displays tooltip
     */
    private __handleHotspots(clientX: number, clientY: number) {
        const hotspotId = this.__findHotspot(clientX, clientY);

        if (this.state.hotspotId !== hotspotId) {
            this.__resetHotspot();

            if (hotspotId) {
                let tooltip;
                if (hotspotId.startsWith(HOTSPOT_MARKER_ID)) {
                    tooltip = this.state.markers.find(({ id }) => id === hotspotId)?.tooltip;
                } else {
                    tooltip = this.config.hotspots.find(({ id }) => id === hotspotId)?.tooltip;
                }

                if (tooltip) {
                    const hotspotPos = this.state.hotspotPos[hotspotId];
                    const viewerPos = utils.getPosition(this.viewer.container);

                    this.state.hotspotTooltip = this.viewer.createTooltip({
                        content: tooltip,
                        left: hotspotPos.x - viewerPos.x,
                        top: hotspotPos.y - viewerPos.y,
                        box: {
                            width: this.config.spotSize,
                            height: this.config.spotSize,
                        },
                    });
                }
            }

            this.state.hotspotId = hotspotId;
        }
    }

    /**
     * Dispatch event when a hotspot is clicked
     */
    private __clickHotspot(clientX: number, clientY: number) {
        const hotspotId = this.__findHotspot(clientX, clientY);

        if (hotspotId) {
            this.plugin.dispatchEvent(new SelectHotspot(hotspotId));

            if (hotspotId.startsWith(HOTSPOT_MARKER_ID)) {
                const markerId = hotspotId.substring(HOTSPOT_MARKER_ID.length);
                this.viewer.getPlugin<MarkersPlugin>('markers').gotoMarker(markerId);
            }

            if (this.maximized) {
                this.toggleMaximized();
            }
        }

        this.__resetHotspot();
    }

    private __resetHotspot() {
        this.state.hotspotTooltip?.hide();
        this.state.hotspotTooltip = null;
        this.state.hotspotId = null;
    }

    private __loadImage(url: string): HTMLImageElement {
        if (!url) {
            return null;
        }

        if (!this.state.images[url]) {
            const image = loadImage(url);

            this.state.images[url] = {
                loading: true,
                value: image,
            };

            image.onload = () => {
                this.state.images[url].loading = false;
                this.update();
            };

            return null;
        }

        if (this.state.images[url].loading) {
            return null;
        }

        return this.state.images[url].value;
    }
}
