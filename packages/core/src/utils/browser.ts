import { Point } from '../model';

/**
 * Get an element in the page by an unknown selector
 */
export function getElement(selector: string | HTMLElement): HTMLElement {
    if (typeof selector === 'string') {
        return selector.match(/^[a-z]/i) ? document.getElementById(selector) : document.querySelector(selector);
    } else {
        return selector;
    }
}

/**
 * Toggles a CSS class
 */
export function toggleClass(element: Element, className: string, active?: boolean) {
    if (active === undefined) {
        element.classList.toggle(className);
    } else if (active) {
        element.classList.add(className);
    } else if (!active) {
        element.classList.remove(className);
    }
}

/**
 * Adds one or several CSS classes to an element
 */
export function addClasses(element: Element, className: string) {
    element.classList.add(...className.split(' '));
}

/**
 * Removes one or several CSS classes to an element
 */
export function removeClasses(element: Element, className: string) {
    element.classList.remove(...className.split(' '));
}

/**
 * Searches if an element has a particular parent at any level including itself
 */
export function hasParent(el: HTMLElement, parent: Element): boolean {
    let test: HTMLElement | null = el;

    do {
        if (test === parent) {
            return true;
        }
        test = test.parentElement;
    } while (test);

    return false;
}

/**
 * Gets the closest parent (can by itself)
 */
export function getClosest(el: HTMLElement, selector: string): HTMLElement | null {
    // When el is document or window, the matches does not exist
    if (!el?.matches) {
        return null;
    }

    let test: HTMLElement | null = el;

    do {
        if (test.matches(selector)) {
            return test;
        }
        test = test.parentElement;
    } while (test);

    return null;
}

/**
 * Gets the position of an element in the viewer without reflow
 * @description Will gives the same result as getBoundingClientRect() as soon as there are no CSS transforms
 */
export function getPosition(el: HTMLElement): Point {
    let x = 0;
    let y = 0;
    let test: HTMLElement | null = el;

    while (test) {
        x += test.offsetLeft - test.scrollLeft + test.clientLeft;
        y += test.offsetTop - test.scrollTop + test.clientTop;
        test = test.offsetParent as HTMLElement;
    }

    return { x, y };
}

/**
 * Gets an element style value
 */
export function getStyle(elt: Element, prop: string): string {
    return (window.getComputedStyle(elt, null) as any)[prop];
}
