import type { Navbar } from '../components/Navbar';
import icon from '../icons/fullscreen-in.svg';
import iconActive from '../icons/fullscreen-out.svg';
import { FullscreenEvent } from '../events';
import { AbstractButton } from './AbstractButton';

export class FullscreenButton extends AbstractButton {
    static override readonly id = 'fullscreen';

    constructor(navbar: Navbar) {
        super(navbar, {
            className: 'psv-fullscreen-button',
            hoverScale: true,
            collapsable: false,
            tabbable: true,
            icon: icon,
            iconActive: iconActive,
        });

        this.viewer.addEventListener(FullscreenEvent.type, this);
    }

    override destroy() {
        this.viewer.removeEventListener(FullscreenEvent.type, this);

        super.destroy();
    }

    handleEvent(e: Event) {
        if (e instanceof FullscreenEvent) {
            this.toggleActive(e.fullscreenEnabled);
        }
    }

    onClick() {
        this.viewer.toggleFullscreen();
    }
}
