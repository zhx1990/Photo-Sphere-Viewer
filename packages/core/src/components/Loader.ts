import { ConfigChangedEvent, LoadProgressEvent } from '../events';
import { getStyle } from '../utils';
import type { Viewer } from '../Viewer';
import { AbstractComponent } from './AbstractComponent';

/**
 * Loader component
 */
export class Loader extends AbstractComponent {
    private readonly loader: HTMLElement;
    private readonly canvas: SVGElement;

    private readonly size: number;
    private readonly border: number;
    private readonly thickness: number;
    private readonly color: string;
    private readonly textColor: string;

    /**
     * @internal
     */
    constructor(viewer: Viewer) {
        super(viewer, { className: 'psv-loader-container' });

        this.loader = document.createElement('div');
        this.loader.className = 'psv-loader';
        this.container.appendChild(this.loader);

        this.size = this.loader.offsetWidth;

        this.canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.canvas.setAttribute('class', 'psv-loader-canvas');
        this.canvas.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
        this.loader.appendChild(this.canvas);

        this.textColor = getStyle(this.loader, 'color');
        this.color = getStyle(this.canvas, 'color');
        this.border = parseInt(getStyle(this.loader, 'outlineWidth'), 10);
        this.thickness = parseInt(getStyle(this.canvas, 'outlineWidth'), 10);

        this.viewer.addEventListener(ConfigChangedEvent.type, this);

        this.__updateContent();
        this.hide();
    }

    /**
     * @internal
     */
    override destroy(): void {
        this.viewer.removeEventListener(ConfigChangedEvent.type, this);

        super.destroy();
    }

    /**
     * @internal
     */
    handleEvent(e: Event) {
        if (e instanceof ConfigChangedEvent) {
            e.containsOptions('loadingImg', 'loadingTxt') && this.__updateContent();
        }
    }

    /**
     * Sets the loader progression
     */
    setProgress(value: number) {
        const angle = (Math.min(value, 99.999) / 100) * Math.PI * 2;
        const halfSize = this.size / 2;
        const startX = halfSize;
        const startY = this.thickness / 2 + this.border;
        const radius = (this.size - this.thickness) / 2 - this.border;
        const endX = Math.sin(angle) * radius + halfSize;
        const endY = -Math.cos(angle) * radius + halfSize;
        const largeArc = value > 50 ? '1' : '0';

        this.canvas.innerHTML = `
            <circle cx="${halfSize}" cy="${halfSize}" r="${halfSize}" fill="${this.color}"/>
            <path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}" 
                  fill="none" stroke="${this.textColor}" stroke-width="${this.thickness}" stroke-linecap="round"/>
        `;

        this.viewer.dispatchEvent(new LoadProgressEvent(Math.round(value)));
    }

    private __updateContent() {
        const current = this.loader.querySelector('.psv-loader-image, .psv-loader-text');
        if (current) {
            this.loader.removeChild(current);
        }

        let inner;
        if (this.viewer.config.loadingImg) {
            inner = document.createElement('img');
            inner.className = 'psv-loader-image';
            inner.src = this.viewer.config.loadingImg;
        } else if (this.viewer.config.loadingTxt) {
            inner = document.createElement('div');
            inner.className = 'psv-loader-text';
            inner.innerHTML = this.viewer.config.loadingTxt;
        }
        if (inner) {
            const size = Math.round(Math.sqrt(2 * Math.pow(this.size / 2 - this.thickness / 2 - this.border, 2)));
            inner.style.maxWidth = size + 'px';
            inner.style.maxHeight = size + 'px';
            this.loader.appendChild(inner);
        }
    }
}
