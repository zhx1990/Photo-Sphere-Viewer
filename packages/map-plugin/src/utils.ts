import { Point, SYSTEM } from '@photo-sphere-viewer/core';

export function loadImage(src: string): HTMLImageElement {
    const image = document.createElement('img');

    if (!src.includes('<svg')) {
        image.src = src;
    } else {
        // the SVG must have it's own size, use the viewBox if not defined
        if (!/<svg[^>]*width="/.test(src) && src.includes('viewBox')) {
            const [, , , width, height] = /viewBox="([0-9-]+) ([0-9-]+) ([0-9]+) ([0-9]+)"/.exec(src);
            src = src.replace('<svg', `<svg width="${width}px" height="${height}px"`);
        }

        const src64 = `data:image/svg+xml;base64,${window.btoa(src)}`;
        image.src = src64;
    }

    return image;
}

export function getImageHtml(src: string): string {
    if (!src) {
        return '';
    } else if (!src.includes('<svg')) {
        return `<img src="${src}">`;
    } else {
        return src;
    }
}

export function unprojectPoint(pt: Point, yaw: number, zoom: number): Point {
    return {
        x: (Math.cos(yaw) * pt.x - Math.sin(yaw) * pt.y) / zoom,
        y: (Math.sin(yaw) * pt.x + Math.cos(yaw) * pt.y) / zoom,
    };
}

export function projectPoint(pt: Point, yaw: number, zoom: number): Point {
    return {
        x: (Math.cos(-yaw) * pt.x - Math.sin(-yaw) * pt.y) * zoom,
        y: (Math.sin(-yaw) * pt.x + Math.cos(-yaw) * pt.y) * zoom,
    };
}

/**
 * Draw an image centered on a point, with a rotation, scaled
 */
export function drawImageCentered(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    size: number,
    x: number,
    y: number,
    angle: number
) {
    const w = image.width;
    const h = image.height;

    context.save();
    context.translate(x * SYSTEM.pixelRatio, y * SYSTEM.pixelRatio);
    context.rotate(angle);
    // prettier-ignore
    drawImageHighDpi(
        context,
        image,
        -size / 2,
        -((h / w) * size) / 2,
        size,
        (h / w) * size
    );
    context.restore();
}

/**
 * Standard "drawImage" using devicePixelRatio
 */
export function drawImageHighDpi(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
) {
    context.drawImage(
        image,
        0, 0,
        image.width, image.height,
        x * SYSTEM.pixelRatio, y * SYSTEM.pixelRatio,
        w * SYSTEM.pixelRatio, h * SYSTEM.pixelRatio
    );
}
