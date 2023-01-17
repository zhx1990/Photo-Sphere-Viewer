import { Point, Position } from '../model';

/**
 * Ensures a value is within 0 and `max` by wrapping max to 0
 */
export function wrap(value: number, max: number): number {
    let result = value % max;

    if (result < 0) {
        result += max;
    }

    return result;
}

/**
 * Computes the sum of an array
 */
export function sum(array: number[]): number {
    return array.reduce((a, b) => a + b, 0);
}

/**
 * Computes the distance between two points
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Computes the angle wet ween two points
 */
export function angle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Compute the shortest offset between two angles on a sphere
 */
export function getShortestArc(from: number, to: number): number {
    const candidates = [
        0, // direct
        Math.PI * 2, // clock-wise cross zero
        -Math.PI * 2, // counter-clock-wise cross zero
    ];

    return candidates.reduce((value, candidate) => {
        const newCandidate = to - from + candidate;
        return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
    }, Infinity);
}

/**
 * Computes the angle between the current position and a target position
 */
export function getAngle(position1: Position, position2: Position): number {
    // prettier-ignore
    return Math.acos(
        Math.cos(position1.pitch)
        * Math.cos(position2.pitch) 
        * Math.cos(position1.yaw - position2.yaw) 
        + Math.sin(position1.pitch) 
        * Math.sin(position2.pitch)
    );
}

/**
 * Returns the distance between two points on a sphere of radius one
 * @link http://www.movable-type.co.uk/scripts/latlong.html
 */
export function greatArcDistance([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
    const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    const y = lat2 - lat1;
    return Math.sqrt(x * x + y * y);
}
