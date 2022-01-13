import * as THREE from 'three';

/**
 * @summary Tests if a number is power of two
 * @memberOf PSV.adapters
 * @param {number} x
 * @return {boolean}
 * @package
 */
export function powerOfTwo(x) {
  return (Math.log(x) / Math.log(2)) % 1 === 0;
}

/**
 * @summary Generates an material for errored tiles
 * @memberOf PSV.adapters
 * @return {external:THREE.MeshBasicMaterial}
 * @package
 */
export function buildErrorMaterial(width, height, side = THREE.BackSide) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${canvas.width / 5}px serif`;
  ctx.fillStyle = '#a22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠', canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.MeshBasicMaterial({
    side: side,
    map : texture,
  });
}
