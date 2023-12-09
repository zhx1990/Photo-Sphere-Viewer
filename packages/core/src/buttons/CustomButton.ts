import type { Navbar } from '../components/Navbar';
import { NavbarCustomButton } from '../model';
import { AbstractButton } from './AbstractButton';

export class CustomButton extends AbstractButton {
    private readonly customOnClick: NavbarCustomButton['onClick'];

    constructor(navbar: Navbar, config: NavbarCustomButton) {
        super(navbar, {
            className: `psv-custom-button ${config.className || ''}`,
            hoverScale: false,
            collapsable: config.collapsable !== false,
            tabbable: config.tabbable !== false,
            title: config.title,
        });

        this.customOnClick = config.onClick;

        if (config.id) {
            this.config.id = config.id;
        } else {
            this.config.id = 'psvButton-' + Math.random().toString(36).substring(2);
        }

        if (config.content) {
            if (typeof config.content === 'string') {
                this.container.innerHTML = config.content;
            } else {
                this.container.classList.add('psv-custom-button--no-padding');
                config.content.style.height = '100%';
                config.content.attachViewer?.(this.viewer);
                this.container.appendChild(config.content);
            }
        }

        this.state.width = this.container.offsetWidth;

        if (config.disabled) {
            this.disable();
        }

        if (config.visible === false) {
            this.hide();
        }
    }

    onClick() {
        this.customOnClick?.(this.viewer);
    }
}
