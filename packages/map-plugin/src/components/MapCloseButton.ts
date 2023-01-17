import { CONSTANTS } from '@photo-sphere-viewer/core';
import icon from '../icons/map.svg';
import { AbstractMapButton, ButtonPosition } from './AbstractMapButton';
import type { MapComponent } from './MapComponent';

export class MapCloseButton extends AbstractMapButton {
    constructor(private map: MapComponent) {
        super(map, ButtonPosition.DEFAULT, 'psv-map__button-close');

        this.update();

        this.container.addEventListener('click', (e) => {
            map.toggleCollapse();
            e.stopPropagation();
        });
    }

    update() {
        this.container.innerHTML = this.map.collapsed ? icon : CONSTANTS.ICONS.close;
        this.container.title = this.map.collapsed ? this.viewer.config.lang['map'] : this.viewer.config.lang.close;
    }
}
