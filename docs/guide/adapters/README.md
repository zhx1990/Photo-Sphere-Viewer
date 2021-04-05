# Adapters

Adapters are small pieces of code responsible to load the panorama texture(s) in the THREE.js scene.

The supported adapters are:
- `equirectangular`: the default adapter, used to load full or partial equirectangular panoramas
- [cubemap](cubemap.md): used to load cubemaps projections (six textures)
- [equirectangular tiles](tiles.md): used to load tiled equirectangular panoramas

## Import an adapter

Official adapters (listed on the left menu) are available in the the main `photo-sphere-viewer` package inside the `dist/adapters` directory.

**Example for the Cubemap adapter:**

:::: tabs

::: tab Direct import
```html
<!-- base imports of PSV and dependencies -->

<script src="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/adapters/cubemap.min.js"></script>
```
:::

::: tab ES import
```js
import CubemapAdapter from 'photo-sphere-viewer/dist/adapters/cubemap';
```
:::

::::
