import { utils } from '@photo-sphere-viewer/core';
import type { Mesh, BufferGeometry, MeshBasicMaterial } from 'three';

/**
 * Changes the color of a mesh
 */
export function setMeshColor(mesh: Mesh<BufferGeometry, MeshBasicMaterial>, color: string) {
    mesh.material.color.set(color);
}

/**
 * Returns the distance between two GPS points
 */
export function distance(p1: [number, number], p2: [number, number]): number {
    return utils.greatArcDistance(p1, p2) * 6371e3;
}

/**
 * Returns the bearing between two GPS points
 * @link http://www.movable-type.co.uk/scripts/latlong.html
 */
export function bearing(p1: [number, number], p2: [number, number]): number {
    const [long1, lat1] = p1;
    const [long2, lat2] = p2;

    const y = Math.sin(long2 - long1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(long2 - long1);
    return Math.atan2(y, x);
}
