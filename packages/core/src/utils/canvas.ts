import { RGB } from 'three';
import { rgbCss } from './misc';

/**
 * Creates a simple horizontal gradient
 */
export function createHorizontalGradient(ctx: CanvasRenderingContext2D, x1: number, x2: number, c1: RGB, c2: RGB) {
    const grad = ctx.createLinearGradient(x1, 0, x2, 0);
    grad.addColorStop(0, rgbCss(c1));
    grad.addColorStop(1, rgbCss(c2));
    return grad;
}

/**
 * Gets the average RGB color of a portion from a canvas element
 */
export function getAverageColor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    every: number
): RGB {
    every = Math.round(every);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    const data = ctx.getImageData(x, y, w, h);

    for (let row = 0; row < h; row += every) {
        for (let col = 0; col < w; col += every) {
            const i = 4 * (row * w + col);
            r += data.data[i];
            g += data.data[i + 1];
            b += data.data[i + 2];
            count++;
        }
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    return { r, g, b };
}
