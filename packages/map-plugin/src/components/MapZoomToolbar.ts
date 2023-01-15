import { AbstractComponent, utils } from '@photo-sphere-viewer/core';
import minus from '../icons/minus.svg';
import plus from '../icons/plus.svg';
import type { MapComponent } from './MapComponent';

export class MapZoomToolbar extends AbstractComponent {
    private readonly zoomIndicator: HTMLElement;
    private readonly handler = new utils.PressHandler(100);
    private time: number;
    private animation?: ReturnType<typeof requestAnimationFrame>;

    constructor(private map: MapComponent) {
        super(map, {
            className: 'psv-map__toolbar',
        });

        this.container.innerHTML = `${minus}<span class="psv-map__toolbar-text">100%</span>${plus}`;

        this.zoomIndicator = this.container.querySelector('.psv-map__toolbar-text');

        const zoomButtons = this.container.querySelectorAll('svg');
        this.bindZoomButton(zoomButtons[0], -1);
        this.bindZoomButton(zoomButtons[1], 1);
    }

    setText(zoom: number) {
        this.zoomIndicator.innerText = `${Math.round(zoom * 100)}%`;
    }

    private bindZoomButton(button: SVGElement, delta: 1 | -1) {
        button.addEventListener('mousedown', () => {
            cancelAnimationFrame(this.animation);
            this.handler.down();
            this.time = performance.now();
            this.animateZoom(delta);
        });

        button.addEventListener('mouseup', () => {
            this.handler.up(() => {
                cancelAnimationFrame(this.animation);
                this.animation = null;
            });
        });
    }

    private animateZoom(delta: 1 | -1) {
        this.animation = requestAnimationFrame((t) => {
            this.map.zoom((delta * (t - this.time)) / 1000);
            this.time = t;
            this.animateZoom(delta);
        });
    }
}
