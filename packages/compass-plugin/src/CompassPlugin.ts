import type { Position, Viewer } from '@photo-sphere-viewer/core';
import { AbstractPlugin, events, SYSTEM, utils } from '@photo-sphere-viewer/core';
import type { events as markersEvents, Marker, MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { MathUtils } from 'three';
import compass from './compass.svg';
import { CompassHotspot, CompassPluginConfig, ParsedCompassPluginConfig } from './model';

const getConfig = utils.getConfigParser<CompassPluginConfig, ParsedCompassPluginConfig>(
    {
        size: '120px',
        position: ['top', 'left'],
        backgroundSvg: compass,
        coneColor: 'rgba(255, 255, 255, 0.5)',
        navigation: true,
        navigationColor: 'rgba(255, 0, 0, 0.2)',
        hotspots: [],
        hotspotColor: 'rgba(0, 0, 0, 0.5)',
    },
    {
        position: (position, { defValue }) => {
            return utils.cleanCssPosition(position, { allowCenter: true, cssOrder: true }) || defValue;
        },
    }
);

const HOTSPOT_SIZE_RATIO = 1 / 40;

/**
 * Adds a compass on the viewer
 */
export class CompassPlugin extends AbstractPlugin {
    static override readonly id = 'compass';

    readonly config: ParsedCompassPluginConfig;

    private readonly state = {
        visible: true,
        mouse: null as { clientX: number; clientY: number },
        mousedown: false,
        markers: [] as Marker[],
    };

    private markers?: MarkersPlugin;
    private readonly container: HTMLElement;
    private readonly canvas: HTMLCanvasElement;

    constructor(viewer: Viewer, config: CompassPluginConfig) {
        super(viewer);

        this.config = getConfig(config);

        this.container = document.createElement('div');
        this.container.className = `psv-compass psv-compass--${this.config.position.join('-')}`;
        this.container.innerHTML = this.config.backgroundSvg;

        this.container.style.width = this.config.size;
        this.container.style.height = this.config.size;
        if (this.config.position[0] === 'center') {
            this.container.style.marginTop = `calc(-${this.config.size} / 2)`;
        }
        if (this.config.position[1] === 'center') {
            this.container.style.marginLeft = `calc(-${this.config.size} / 2)`;
        }

        this.canvas = document.createElement('canvas');

        this.container.appendChild(this.canvas);

        if (this.config.navigation) {
            this.container.addEventListener('mouseenter', this);
            this.container.addEventListener('mouseleave', this);
            this.container.addEventListener('mousemove', this);
            this.container.addEventListener('mousedown', this);
            this.container.addEventListener('mouseup', this);
            this.container.addEventListener('touchstart', this);
            this.container.addEventListener('touchmove', this);
            this.container.addEventListener('touchend', this);
        }
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.markers = this.viewer.getPlugin('markers');

        this.viewer.container.appendChild(this.container);

        this.canvas.width = this.container.clientWidth * SYSTEM.pixelRatio;
        this.canvas.height = this.container.clientWidth * SYSTEM.pixelRatio;

        this.viewer.addEventListener(events.RenderEvent.type, this);

        if (this.markers) {
            this.markers.addEventListener('set-markers', this);
        }
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.RenderEvent.type, this);

        if (this.markers) {
            this.markers.removeEventListener('set-markers', this);
        }

        this.viewer.container.removeChild(this.container);

        delete this.markers;

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.RenderEvent.type:
                this.__update();
                break;
            case 'set-markers':
                this.state.markers = (e as markersEvents.SetMarkersEvent).markers.filter((m) => m.data?.['compass']);
                this.__update();
                break;
            case 'mouseenter':
            case 'mousemove':
            case 'touchmove':
                this.state.mouse = (e as TouchEvent).changedTouches?.[0] || (e as MouseEvent);
                if (this.state.mousedown) {
                    this.__click();
                } else {
                    this.__update();
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'mousedown':
            case 'touchstart':
                this.state.mousedown = true;
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'mouseup':
            case 'touchend':
                this.state.mouse = (e as TouchEvent).changedTouches?.[0] || (e as MouseEvent);
                this.state.mousedown = false;
                this.__click();
                if ((e as TouchEvent).changedTouches) {
                    this.state.mouse = null;
                    this.__update();
                }
                e.stopPropagation();
                e.preventDefault();
                break;
            case 'mouseleave':
                this.state.mouse = null;
                this.state.mousedown = false;
                this.__update();
                break;
            default:
                break;
        }
    }

    /**
     * Hides the compass
     */
    hide() {
        this.container.style.display = 'none';
        this.state.visible = false;
    }

    /**
     * Shows the compass
     */
    show() {
        this.container.style.display = '';
        this.state.visible = true;
    }

    /**
     * Changes the hotspots on the compass
     */
    setHotspots(hotspots: CompassHotspot[]) {
        this.config.hotspots = hotspots;
        this.__update();
    }

    /**
     * Removes all hotspots
     */
    clearHotspots() {
        this.setHotspots(null);
    }

    /**
     * Updates the compass for current zoom and position
     */
    private __update() {
        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const yaw = this.viewer.getPosition().yaw;
        const fov = MathUtils.degToRad(this.viewer.state.hFov);

        this.__drawCone(context, this.config.coneColor, yaw, fov);

        const mouseAngle = this.__getMouseAngle();
        if (mouseAngle !== null) {
            this.__drawCone(context, this.config.navigationColor, mouseAngle, fov);
        }

        this.state.markers.forEach((marker) => {
            this.__drawMarker(context, marker);
        });
        this.config.hotspots?.forEach((spot) => {
            if ('yaw' in spot && !('pitch' in spot)) {
                (spot as Position).pitch = 0;
            }
            const pos = this.viewer.dataHelper.cleanPosition(spot);
            this.__drawPoint(context, spot.color || this.config.hotspotColor, pos.yaw, pos.pitch);
        });
    }

    /**
     * Rotates the viewer depending on the position of the mouse on the compass
     */
    private __click() {
        const mouseAngle = this.__getMouseAngle();

        if (mouseAngle !== null) {
            this.viewer.rotate({
                yaw: mouseAngle,
                pitch: 0, // TODO marker or hotspot vertical angle
            });
        }
    }

    /**
     * Draw a cone
     */
    private __drawCone(context: CanvasRenderingContext2D, color: string, yaw: number, fov: number) {
        const a1 = yaw - Math.PI / 2 - fov / 2;
        const a2 = a1 + fov;
        const c = this.canvas.width / 2;

        context.beginPath();
        context.moveTo(c, c);
        context.lineTo(c + Math.cos(a1) * c, c + Math.sin(a1) * c);
        context.arc(c, c, c, a1, a2, false);
        context.lineTo(c, c);
        context.fillStyle = color;
        context.fill();
    }

    /**
     * Draw a Marker
     */
    private __drawMarker(context: CanvasRenderingContext2D, marker: Marker) {
        let color = this.config.hotspotColor;
        if (typeof marker.data['compass'] === 'string') {
            color = marker.data['compass'];
        }

        if (marker.isPoly()) {
            context.beginPath();
            (marker.definition as [number, number][]).forEach(([yaw, pitch], i) => {
                const a = yaw - Math.PI / 2;
                const d = (pitch + Math.PI / 2) / Math.PI;
                const c = this.canvas.width / 2;

                context[i === 0 ? 'moveTo' : 'lineTo'](c + Math.cos(a) * c * d, c + Math.sin(a) * c * d);
            });
            if (marker.isPolygon()) {
                context.fillStyle = color;
                context.fill();
            } else {
                context.strokeStyle = color;
                context.lineWidth = Math.max(1, (this.canvas.width * HOTSPOT_SIZE_RATIO) / 2);
                context.stroke();
            }
        } else {
            const pos = marker.state.position;
            this.__drawPoint(context, color, pos.yaw, pos.pitch);
        }
    }

    /**
     * Draw a point
     */
    private __drawPoint(context: CanvasRenderingContext2D, color: string, yaw: number, pitch: number) {
        const a = yaw - Math.PI / 2;
        const d = (pitch + Math.PI / 2) / Math.PI;
        const c = this.canvas.width / 2;
        const r = Math.max(2, this.canvas.width * HOTSPOT_SIZE_RATIO);

        context.beginPath();
        // prettier-ignore
        context.ellipse(
            c + Math.cos(a) * c * d, c + Math.sin(a) * c * d, 
            r, r,
            0, 0,
            Math.PI * 2
        );
        context.fillStyle = color;
        context.fill();
    }

    /**
     * Gets the horizontal angle corresponding to the mouse position on the compass
     */
    private __getMouseAngle(): number | null {
        if (!this.state.mouse) {
            return null;
        }

        const boundingRect = this.container.getBoundingClientRect();
        const mouseX = this.state.mouse.clientX - boundingRect.left - boundingRect.width / 2;
        const mouseY = this.state.mouse.clientY - boundingRect.top - boundingRect.width / 2;

        if (Math.sqrt(mouseX * mouseX + mouseY * mouseY) > boundingRect.width / 2) {
            return null;
        }

        return Math.atan2(mouseY, mouseX) + Math.PI / 2;
    }
}
