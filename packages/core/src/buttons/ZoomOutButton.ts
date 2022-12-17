import type { Navbar } from '../components/Navbar';
import icon from '../icons/zoom-out.svg';
import { AbstractZoomButton, ZoomButtonDirection } from './AbstractZoomButton';

export class ZoomOutButton extends AbstractZoomButton {
    static override readonly id = 'zoomOut';

    constructor(navbar: Navbar) {
        super(navbar, ZoomButtonDirection.OUT, icon);
    }
}
