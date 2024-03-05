import { CONSTANTS, Point, Position, utils, type Viewer } from '@photo-sphere-viewer/core';
import { MathUtils } from 'three';
import { DEFAULT_HOVER_SCALE, MARKER_DATA } from '../constants';
import { type MarkersPlugin } from '../MarkersPlugin';
import { MarkerType } from '../MarkerType';
import { MarkerConfig } from '../model';
import { AbstractDomMarker } from './AbstractDomMarker';
import { Marker } from './Marker';

/**
 * Base class for standard markers (all but 3d and poly)
 * @internal
 */
export abstract class AbstractStandardMarker extends AbstractDomMarker {
    constructor(viewer: Viewer, plugin: MarkersPlugin, config: MarkerConfig) {
        super(viewer, plugin, config);
    }

    override createElement(): void {
        this.element[MARKER_DATA] = this;

        this.domElement.addEventListener('transitionend', () => {
            // the transition "scale" is only applied manually on mouseover
            // because it must not be present when the scale changes on zoom/move
            this.domElement.style.transition = '';
        });
    }

    override render({
        viewerPosition,
        zoomLevel,
        hoveringMarker,
    }: {
        viewerPosition: Position;
        zoomLevel: number;
        hoveringMarker: Marker;
    }): Point {
        this.__updateSize();

        const position = this.viewer.dataHelper.vector3ToViewerCoords(this.state.positions3D[0]);
        position.x -= this.state.size.width * this.state.anchor.x;
        position.y -= this.state.size.height * this.state.anchor.y;

        // It tests if the point is in the general direction of the camera, then check if it's in the viewport
        const isVisible = (
            this.state.positions3D[0].dot(this.viewer.state.direction) > 0
            && position.x + this.state.size.width >= 0
            && position.x - this.state.size.width <= this.viewer.state.size.width
            && position.y + this.state.size.height >= 0
            && position.y - this.state.size.height <= this.viewer.state.size.height
        );

        if (isVisible) {
            this.domElement.style.translate = `${position.x}px ${position.y}px 0px`;

            this.applyScale({
                zoomLevel,
                viewerPosition,
                mouseover: this === hoveringMarker,
            });

            if (this.type === MarkerType.element) {
                this.config.element.updateMarker?.({
                    marker: this,
                    position,
                    viewerPosition,
                    zoomLevel,
                    viewerSize: this.viewer.state.size,
                });
            }

            return position;
        } else {
            return null;
        }
    }

    override update(config: MarkerConfig): void {
        super.update(config);

        const element = this.domElement;

        element.classList.add('psv-marker--normal');

        if (this.config.scale && Array.isArray(this.config.scale)) {
            this.config.scale = { zoom: this.config.scale as any };
        }
        if (typeof this.config.hoverScale === 'boolean') {
            this.config.hoverScale = this.config.hoverScale
                ? this.plugin.config.defaultHoverScale || DEFAULT_HOVER_SCALE
                : null;
        } else if (typeof this.config.hoverScale === 'number') {
            this.config.hoverScale = { amount: this.config.hoverScale } as any;
        } else if (!this.config.hoverScale) {
            this.config.hoverScale = this.plugin.config.defaultHoverScale;
        }
        if (this.config.hoverScale) {
            this.config.hoverScale = {
                ...DEFAULT_HOVER_SCALE,
                ...this.plugin.config.defaultHoverScale,
                ...this.config.hoverScale,
            };
        }

        element.style.rotate = this.config.rotation !== 0 ? MathUtils.radToDeg(this.config.rotation) + 'deg' : null;
    }

    /**
     * Computes the real size of a marker
     * @description This is done by removing all it's transformations (if any) and making it visible
     * before querying its bounding rect
     */
    private __updateSize() {
        if (!this.state.dynamicSize) {
            return;
        }

        const element = this.domElement;
        const init = !this.state.size;

        if (init) {
            element.classList.add('psv-marker--transparent');
        }

        if (this.isSvg()) {
            const rect = (element.firstElementChild as SVGElement).getBoundingClientRect();
            this.state.size = {
                width: rect.width,
                height: rect.height,
            };
        } else if (this.isNormal()) {
            this.state.size = {
                width: (element as HTMLElement).offsetWidth,
                height: (element as HTMLElement).offsetHeight,
            };
        }

        if (init) {
            element.classList.remove('psv-marker--transparent');
        }

        if (this.isSvg()) {
            // the real size must be declared on the SVG root
            element.style.width = this.state.size.width + 'px';
            element.style.height = this.state.size.height + 'px';
        }

        // custom element HTML marker remain dynamic
        if (this.type !== MarkerType.element) {
            this.state.dynamicSize = false;
        }
    }

    /**
     * Computes and applies the scale to the marker
     */
    applyScale({
        zoomLevel,
        viewerPosition,
        mouseover,
    }: {
        zoomLevel: number;
        viewerPosition: Position;
        mouseover: boolean;
    }) {
        if (mouseover !== null && this.config.hoverScale) {
            this.domElement.style.transition = `scale ${this.config.hoverScale.duration}ms ${this.config.hoverScale.easing}`;
        }

        let scale = 1;
        if (typeof this.config.scale === 'function') {
            scale = this.config.scale(zoomLevel, viewerPosition);
        } else if (this.config.scale) {
            if (Array.isArray(this.config.scale.zoom)) {
                const [min, max] = this.config.scale.zoom;
                scale *= min + (max - min) * CONSTANTS.EASINGS.inQuad(zoomLevel / 100);
            }
            if (Array.isArray(this.config.scale.yaw)) {
                const [min, max] = this.config.scale.yaw;
                const halfFov = MathUtils.degToRad(this.viewer.state.hFov) / 2;
                const arc = Math.abs(utils.getShortestArc(this.state.position.yaw, viewerPosition.yaw));
                scale *= max + (min - max) * CONSTANTS.EASINGS.outQuad(Math.max(0, (halfFov - arc) / halfFov));
            }
        }
        if (mouseover && this.config.hoverScale) {
            scale *= this.config.hoverScale.amount;
        }

        this.domElement.style.scale = `${scale}`;
    }
}
