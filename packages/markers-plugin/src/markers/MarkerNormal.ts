import { PSVError, utils, type Viewer } from '@photo-sphere-viewer/core';
import { type MarkersPlugin } from '../MarkersPlugin';
import { MarkerType } from '../MarkerType';
import { MarkerConfig } from '../model';
import { AbstractStandardMarker } from './AbstractStandardMarker';

/**
 * @internal
 */
export class MarkerNormal extends AbstractStandardMarker {
    constructor(viewer: Viewer, plugin: MarkersPlugin, config: MarkerConfig) {
        super(viewer, plugin, config);
    }

    override isNormal(): boolean {
        return true;
    }

    override createElement(): void {
        this.element = document.createElement('div');
        super.createElement();
    }

    override update(config: MarkerConfig): void {
        super.update(config);

        const element = this.domElement;

        if (!utils.isExtendedPosition(this.config.position)) {
            throw new PSVError('missing marker position');
        }
        if (this.config.image && !this.config.size) {
            throw new PSVError('missing marker size');
        }

        if (this.config.size) {
            this.state.dynamicSize = false;
            this.state.size = this.config.size;
            element.style.width = this.config.size.width + 'px';
            element.style.height = this.config.size.height + 'px';
        } else {
            this.state.dynamicSize = true;
        }

        switch (this.type) {
            case MarkerType.image:
                this.definition = this.config.image;
                element.style.backgroundImage = `url(${this.config.image})`;
                break;
            case MarkerType.html:
                this.definition = this.config.html;
                element.innerHTML = this.config.html;
                break;
            case MarkerType.element:
                if (this.definition !== this.config.element) {
                    this.definition = this.config.element;
                    element.childNodes.forEach((n) => n.remove());
                    element.appendChild(this.config.element);
                    this.config.element.style.display = 'block';
                }
                break;
        }

        // set anchor
        element.style.transformOrigin = `${this.state.anchor.x * 100}% ${this.state.anchor.y * 100}%`;

        // convert texture coordinates to spherical coordinates
        this.state.position = this.viewer.dataHelper.cleanPosition(this.config.position);

        // compute x/y/z position
        this.state.positions3D = [this.viewer.dataHelper.sphericalCoordsToVector3(this.state.position)];
    }
}
