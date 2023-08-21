/**
 * Custom element used for the markers demo
 */
export class CustomMarkerElement extends HTMLElement {
    constructor() {
        super();

        const dom = this.attachShadow({ mode: 'closed' });

        const style = document.createElement('style');
        dom.appendChild(style);
        style.innerText = STYLE;

        const button = document.createElement('button');
        dom.appendChild(button);
        button.innerHTML = ICON;

        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');
        dom.appendChild(tooltip);
        tooltip.innerHTML = '<slot></slot>';

        button.addEventListener('mouseenter', () => {
            tooltip.classList.add('hovered');
        });
    }
}

const STYLE = `
:host {
    display: block;
    position: relative;
    width: 50px;
    height: 50px;
}

button {
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    color: white;
    border-radius: 50%;
}
button:hover {
    animation: shadow 1s ease-out;
}
@keyframes shadow {
    0% { box-shadow: 0 0 0 0px rgba(97, 170, 242, 0); }
    20% {  box-shadow: 0 0 0 5px rgba(97, 170, 242, 1); }
    100% {  box-shadow: 0 0 0 20px rgba(97, 170, 242, 0); }
}

.tooltip {
    box-sizing: border-box;
    width: 300px;
    position: absolute;
    bottom: calc(100% + 10px);
    left: calc(50% -  150px);
    background: rgba(30, 30, 30, 0.8);
    color: white;
    border-radius: 15px;
    transform-origin: 50% calc(100% + 35px);
    transform: rotate(30deg);
    opacity: 0;
}
.tooltip.hovered {
    animation: rotate-bounce-out 200ms ease forwards;
}
.tooltip slot::slotted(img) {
    width: 100%;
    border-radius: 15px 15px 0 0;
}
.tooltip slot::slotted(h2),
.tooltip slot::slotted(p) {
    margin: 1rem;
    text-align: justify;
}
.tooltip::after {
    content: '';
    width: 0px;
    height: 0px;
    border: 10px solid transparent;
    border-top-color: rgba(30, 30, 30, 0.8);
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -10px;
}
button:hover + .tooltip {
    animation: rotate-bounce-in 300ms ease forwards;
}
@keyframes rotate-bounce-in {
    0% { transform: rotate(30deg); opacity: 0; }
    70% { transform: rotate(-10deg); }
    100% { transform: rotate(0deg); opacity: 1; }
}
@keyframes rotate-bounce-out {
    0% { transform: rotate(0deg); opacity: 1; }
    100% { transform: rotate(30deg); opacity: 0; }
}
`;

const ICON = `<svg viewBox="0 0 100 100">
<circle cx=50 cy=50 r=25 fill="currentColor"/>
<circle cx=50 cy=50 r=40 stroke-width=10 fill="none" stroke="currentColor"/>
</svg>`;
