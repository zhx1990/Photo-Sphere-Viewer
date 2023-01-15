import { utils } from '@photo-sphere-viewer/core';
import maximize from '../icons/maximize.svg';
import minimize from '../icons/minimize.svg';
import { AbstractMapButton, ButtonPosition } from './AbstractMapButton';
import type { MapComponent } from './MapComponent';

const ROTATION: Record<string, number> = {
    'bottom-left': 0,
    'bottom-right': -90,
    'top-right': 180,
    'top-left': 90,
};

export class MapMaximizeButton extends AbstractMapButton {
    constructor(private map: MapComponent) {
        super(map, ButtonPosition.DIAGONAL);

        // prettier-ignore
        this.container.style.transform = `${utils.getStyle(this.container, 'transform')} rotate(${ROTATION[map.config.position.join('-')]}deg)`;
        this.update();

        this.container.addEventListener('click', () => {
            map.toggleMaximized();
            this.update();
        });
    }

    private update() {
        this.container.innerHTML = this.map.maximized ? minimize : maximize;
        this.container.title = this.map.maximized
            ? this.viewer.config.lang['mapMinimize']
            : this.viewer.config.lang['mapMaximize'];
    }
}
