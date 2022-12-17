import type { Navbar } from '../components/Navbar';
import icon from '../icons/zoom-in.svg';
import { AbstractZoomButton, ZoomButtonDirection } from './AbstractZoomButton';

export class ZoomInButton extends AbstractZoomButton {
    static override readonly id = 'zoomIn';

    constructor(navbar: Navbar) {
        super(navbar, ZoomButtonDirection.IN, icon);
    }
}
