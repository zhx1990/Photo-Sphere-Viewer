import type { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import type { Position, Viewer } from '@photo-sphere-viewer/core';
import { AbstractConfigurablePlugin, events, utils } from '@photo-sphere-viewer/core';
import { MathUtils } from 'three';
import { Range, UpdatableVisibleRangePluginConfig, VisibleRangePluginConfig } from './model';

type RangeResult = {
    rangedPosition: Position;
    sidesReached: Record<'top' | 'left' | 'bottom' | 'right', boolean>;
};

const EPS = 0.000001;

const getConfig = utils.getConfigParser<VisibleRangePluginConfig>({
    verticalRange: null,
    horizontalRange: null,
    usePanoData: false,
});

/**
 * Locks the visible angles
 */
export class VisibleRangePlugin extends AbstractConfigurablePlugin<
    VisibleRangePluginConfig,
    VisibleRangePluginConfig,
    UpdatableVisibleRangePluginConfig
> {
    static override readonly id = 'visible-range';
    static override readonly configParser = getConfig;
    static override readonly readonlyOptions: Array<keyof VisibleRangePluginConfig> = [
        'horizontalRange',
        'verticalRange',
    ];

    private autorotate?: AutorotatePlugin;

    constructor(viewer: Viewer, config: VisibleRangePluginConfig) {
        super(viewer, config);
    }

    /**
     * @internal
     */
    override init() {
        super.init();

        this.autorotate = this.viewer.getPlugin('autorotate');

        this.viewer.addEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.addEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.addEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.addEventListener(events.BeforeAnimateEvent.type, this);
        this.viewer.addEventListener(events.BeforeRotateEvent.type, this);

        this.setVerticalRange(this.config.verticalRange);
        this.setHorizontalRange(this.config.horizontalRange);
    }

    /**
     * @internal
     */
    override destroy() {
        this.viewer.removeEventListener(events.PanoramaLoadedEvent.type, this);
        this.viewer.removeEventListener(events.PositionUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.ZoomUpdatedEvent.type, this);
        this.viewer.removeEventListener(events.BeforeAnimateEvent.type, this);
        this.viewer.removeEventListener(events.BeforeRotateEvent.type, this);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        switch (e.type) {
            case events.PanoramaLoadedEvent.type:
                if (this.config.usePanoData) {
                    this.setRangesFromPanoData();
                }
                break;

            case events.BeforeRotateEvent.type:
            case events.BeforeAnimateEvent.type: {
                const e2 = e as events.BeforeAnimateEvent;
                const { rangedPosition } = this.__applyRanges(e2.position, e2.zoomLevel);
                e2.position = rangedPosition;
                break;
            }

            case events.PositionUpdatedEvent.type: {
                const currentPosition = (e as events.PositionUpdatedEvent).position;
                const { sidesReached, rangedPosition } = this.__applyRanges(currentPosition);

                if ((sidesReached.left || sidesReached.right) && this.autorotate?.isEnabled()) {
                    this.__reverseAutorotate(sidesReached.left, sidesReached.right);
                } else if (
                    Math.abs(currentPosition.yaw - rangedPosition.yaw) > EPS
                    || Math.abs(currentPosition.pitch - rangedPosition.pitch) > EPS
                ) {
                    this.viewer.dynamics.position.setValue(rangedPosition);
                }
                break;
            }

            case events.ZoomUpdatedEvent.type: {
                const currentPosition = this.viewer.getPosition();
                const { rangedPosition } = this.__applyRanges(currentPosition);

                if (
                    Math.abs(currentPosition.yaw - rangedPosition.yaw) > EPS
                    || Math.abs(currentPosition.pitch - rangedPosition.pitch) > EPS
                ) {
                    this.viewer.dynamics.position.setValue(rangedPosition);
                }
                break;
            }
        }
    }

    /**
     * Changes the vertical range
     */
    setVerticalRange(range: Range) {
        // range must have two values
        if (range && range.length !== 2) {
            utils.logWarn('vertical range must have exactly two elements');
            range = null;
        }

        // vertical range is between -PI/2 and PI/2
        if (range) {
            this.config.verticalRange = range.map((angle) => utils.parseAngle(angle, true)) as any;

            if (this.config.verticalRange[0] > this.config.verticalRange[1]) {
                utils.logWarn('vertical range values must be ordered');
                this.config.verticalRange = [this.config.verticalRange[1], this.config.verticalRange[0]] as any;
            }

            if (this.viewer.state.ready) {
                this.viewer.rotate(this.viewer.getPosition());
            }
        } else {
            this.config.verticalRange = null;
        }
    }

    /**
     * Changes the horizontal range
     */
    setHorizontalRange(range: Range) {
        // horizontal range must have two values
        if (range && range.length !== 2) {
            utils.logWarn('horizontal range must have exactly two elements');
            range = null;
        }

        // horizontal range is between 0 and 2*PI
        if (range) {
            this.config.horizontalRange = range.map((angle) => utils.parseAngle(angle)) as any;

            if (this.viewer.state.ready) {
                this.viewer.rotate(this.viewer.getPosition());
            }
        } else {
            this.config.horizontalRange = null;
        }
    }

    /**
     * Changes the ranges according the current panorama cropping data
     */
    setRangesFromPanoData() {
        this.setVerticalRange(this.__getPanoVerticalRange());
        this.setHorizontalRange(this.__getPanoHorizontalRange());
    }

    /**
     * Gets the vertical range defined by the viewer's panoData
     */
    private __getPanoVerticalRange(): Range {
        const p = this.viewer.state.panoData;
        if (p.croppedHeight === p.fullHeight) {
            return null;
        } else {
            const getAngle = (y: number) => Math.PI * (1 - y / p.fullHeight) - Math.PI / 2;
            return [getAngle(p.croppedY + p.croppedHeight), getAngle(p.croppedY)];
        }
    }

    /**
     * Gets the horizontal range defined by the viewer's panoData
     */
    private __getPanoHorizontalRange(): Range {
        const p = this.viewer.state.panoData;
        if (p.croppedWidth === p.fullWidth) {
            return null;
        } else {
            const getAngle = (x: number) => 2 * Math.PI * (x / p.fullWidth) - Math.PI;
            return [getAngle(p.croppedX), getAngle(p.croppedX + p.croppedWidth)];
        }
    }

    /**
     * Apply "horizontalRange" and "verticalRange"
     */
    private __applyRanges(
        position: Position = this.viewer.getPosition(),
        zoomLevel: number = this.viewer.getZoomLevel()
    ): RangeResult {
        const rangedPosition: Position = { yaw: position.yaw, pitch: position.pitch };
        const sidesReached: Record<string, true> = {};

        const vFov = this.viewer.dataHelper.zoomLevelToFov(zoomLevel);
        const hFov = this.viewer.dataHelper.vFovToHFov(vFov);

        if (this.config.horizontalRange) {
            const range = utils.clone(this.config.horizontalRange) as any;
            const offset = MathUtils.degToRad(hFov) / 2;

            range[0] = utils.parseAngle(range[0] + offset);
            range[1] = utils.parseAngle(range[1] - offset);

            if (range[0] > range[1]) {
                // when the range cross horizontal origin
                if (position.yaw > range[1] && position.yaw < range[0]) {
                    if (position.yaw > range[0] / 2 + range[1] / 2) {
                        // detect which side we are closer too
                        rangedPosition.yaw = range[0];
                        sidesReached.left = true;
                    } else {
                        rangedPosition.yaw = range[1];
                        sidesReached.right = true;
                    }
                }
            } else if (position.yaw < range[0]) {
                rangedPosition.yaw = range[0];
                sidesReached.left = true;
            } else if (position.yaw > range[1]) {
                rangedPosition.yaw = range[1];
                sidesReached.right = true;
            }
        }

        if (this.config.verticalRange) {
            const range = utils.clone(this.config.verticalRange) as any;
            const offset = MathUtils.degToRad(vFov) / 2;

            range[0] = utils.parseAngle(range[0] + offset, true);
            range[1] = utils.parseAngle(range[1] - offset, true);

            // for very a narrow images, lock the horizontal angle to the center
            if (range[0] > range[1]) {
                range[0] = (range[0] + range[1]) / 2;
                range[1] = range[0];
            }

            if (position.pitch < range[0]) {
                rangedPosition.pitch = range[0];
                sidesReached.bottom = true;
            } else if (position.pitch > range[1]) {
                rangedPosition.pitch = range[1];
                sidesReached.top = true;
            }
        }

        return { rangedPosition, sidesReached };
    }

    /**
     * Reverses autorotate direction with smooth transition
     */
    private __reverseAutorotate(left: boolean, right: boolean) {
        // reverse already ongoing
        if (
            (left && this.autorotate.config.autorotateSpeed > 0)
            || (right && this.autorotate.config.autorotateSpeed < 0)
        ) {
            return;
        }

        this.autorotate.reverse();
    }
}
