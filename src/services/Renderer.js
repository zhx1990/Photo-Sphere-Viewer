import * as THREE from 'three';
import { Animation } from '../Animation';
import { EVENTS, SPHERE_RADIUS } from '../data/constants';
import { SYSTEM } from '../data/system';
import { each, isExtendedPosition, isNil } from '../utils';
import { AbstractService } from './AbstractService';

/**
 * @summary Viewer and renderer
 * @extends PSV.services.AbstractService
 * @memberof PSV.services
 */
export class Renderer extends AbstractService {

  /**
   * @param {PSV.Viewer} psv
   */
  constructor(psv) {
    super(psv);

    /**
     * @member {number}
     * @private
     */
    this.mainReqid = undefined;

    /**
     * @member {external:THREE.WebGLRenderer}
     * @readonly
     * @protected
     */
    this.renderer = null;

    /**
     * @member {external:THREE.Scene}
     * @readonly
     * @protected
     */
    this.scene = null;

    /**
     * @member {external:THREE.PerspectiveCamera}
     * @readonly
     * @protected
     */
    this.camera = null;

    /**
     * @member {external:THREE.Mesh}
     * @readonly
     * @protected
     */
    this.mesh = null;

    /**
     * @member {external:THREE.Group}
     * @readonly
     * @private
     */
    this.meshContainer = null;

    /**
     * @member {external:THREE.Raycaster}
     * @readonly
     * @protected
     */
    this.raycaster = null;

    /**
     * @member {number}
     * @private
     */
    this.timestamp = null;

    /**
     * @member {HTMLElement}
     * @readonly
     * @package
     */
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'psv-canvas-container';
    this.canvasContainer.style.background = this.psv.config.canvasBackground;
    this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
    this.psv.container.appendChild(this.canvasContainer);

    psv.on(EVENTS.SIZE_UPDATED, (e, size) => {
      if (this.renderer) {
        this.renderer.setSize(size.width, size.height);
      }
    });

    psv.on(EVENTS.CONFIG_CHANGED, () => {
      this.canvasContainer.style.cursor = this.psv.config.mousemove ? 'move' : 'default';
    });

    this.hide();
  }

  /**
   * @override
   */
  destroy() {
    // cancel render loop
    if (this.mainReqid) {
      window.cancelAnimationFrame(this.mainReqid);
    }

    // destroy ThreeJS view
    if (this.scene) {
      this.__cleanTHREEScene(this.scene);
    }

    // remove container
    this.psv.container.removeChild(this.canvasContainer);

    delete this.canvasContainer;
    delete this.renderer;
    delete this.scene;
    delete this.camera;
    delete this.mesh;
    delete this.meshContainer;
    delete this.raycaster;

    super.destroy();
  }

  /**
   * @summary Hides the viewer
   */
  hide() {
    this.canvasContainer.style.opacity = 0;
  }

  /**
   * @summary Shows the viewer
   */
  show() {
    this.canvasContainer.style.opacity = 1;
  }

  /**
   * @summary Main event loop, calls {@link render} if `prop.needsUpdate` is true
   * @param {number} timestamp
   * @fires PSV.before-render
   * @package
   */
  __renderLoop(timestamp) {
    const elapsed = this.timestamp !== null ? timestamp - this.timestamp : 0;
    this.timestamp = timestamp;

    this.psv.trigger(EVENTS.BEFORE_RENDER, timestamp, elapsed);
    each(this.psv.dynamics, d => d.update(elapsed));

    if (this.prop.needsUpdate) {
      this.render();
      this.prop.needsUpdate = false;
    }

    this.mainReqid = window.requestAnimationFrame(t => this.__renderLoop(t));
  }

  /**
   * @summary Performs a render
   * @description Do not call this method directly, instead call
   * {@link PSV.Viewer#needsUpdate} on {@link PSV.event:before-render}.
   * @fires PSV.render
   */
  render() {
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(this.prop.direction);

    if (this.config.fisheye) {
      this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
    }

    this.updateCameraMatrix();

    this.renderer.render(this.scene, this.camera);

    this.psv.trigger(EVENTS.RENDER);
  }

  /**
   * @summary Updates the camera matrix
   * @package
   */
  updateCameraMatrix() {
    if (this.camera) {
      this.camera.aspect = this.prop.aspect;
      this.camera.fov = this.prop.vFov;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * @summary Applies the texture to the scene, creates the scene if needed
   * @param {PSV.TextureData} textureData
   * @fires PSV.panorama-loaded
   * @package
   */
  setTexture(textureData) {
    if (!this.scene) {
      this.__createScene();
    }

    this.prop.panoData = textureData.panoData;

    this.psv.adapter.setTexture(this.mesh, textureData);

    this.psv.needsUpdate();

    this.psv.trigger(EVENTS.PANORAMA_LOADED);
  }

  /**
   * @summary Apply a panorama data pose to a Mesh
   * @param {PSV.PanoData} [panoData]
   * @param {external:THREE.Mesh} [mesh=this.mesh]
   * @package
   */
  setPanoramaPose(panoData, mesh = this.mesh) {
    if (!isNil(panoData?.poseHeading) || !isNil(panoData?.posePitch) || !isNil(panoData?.poseRoll)) {
      // By Google documentation the angles are applied on the camera in order : heading, pitch, roll
      // here we apply the reverse transformation on the sphere
      mesh.rotation.set(
        -THREE.Math.degToRad(panoData?.posePitch || 0),
        -THREE.Math.degToRad(panoData?.poseHeading || 0),
        -THREE.Math.degToRad(panoData?.poseRoll || 0),
        'ZXY'
      );
    }
    else {
      mesh.rotation.set(0, 0, 0);
    }
  }

  /**
   * @summary Apply a SphereCorrection to a Mesh
   * @param {PSV.SphereCorrection} [sphereCorrection]
   * @param {external:THREE.Mesh} [mesh=this.meshContainer]
   * @package
   */
  setSphereCorrection(sphereCorrection, mesh = this.meshContainer) {
    if (sphereCorrection) {
      const cleanCorrection = this.psv.dataHelper.cleanSphereCorrection(sphereCorrection);

      mesh.rotation.set(
        cleanCorrection.tilt,
        cleanCorrection.pan,
        cleanCorrection.roll,
        'ZXY'
      );
    }
    else {
      mesh.rotation.set(0, 0, 0);
    }
  }

  /**
   * @summary Creates the 3D scene and GUI components
   * @private
   */
  __createScene() {
    this.raycaster = new THREE.Raycaster();

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(this.prop.size.width, this.prop.size.height);
    this.renderer.setPixelRatio(SYSTEM.pixelRatio);

    this.camera = new THREE.PerspectiveCamera(this.prop.vFov, this.prop.size.width / this.prop.size.height, 1, 2 * SPHERE_RADIUS);
    this.camera.position.set(0, 0, 0);

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    this.mesh = this.psv.adapter.createMesh();

    this.meshContainer = new THREE.Group();
    this.meshContainer.add(this.mesh);
    this.scene.add(this.meshContainer);

    // create canvas container
    this.renderer.domElement.className = 'psv-canvas';
    this.canvasContainer.appendChild(this.renderer.domElement);
  }

  /**
   * @summary Performs transition between the current and a new texture
   * @param {PSV.TextureData} textureData
   * @param {PSV.PanoramaOptions} options
   * @returns {PSV.Animation}
   * @package
   */
  transition(textureData, options) {
    const positionProvided = isExtendedPosition(options);
    const zoomProvided = 'zoom' in options;

    const group = new THREE.Group();

    const mesh = this.psv.adapter.createMesh(0.5);
    this.psv.adapter.setTexture(mesh, textureData);
    this.psv.adapter.setTextureOpacity(mesh, 0);
    this.setPanoramaPose(options.panoData, mesh);
    this.setSphereCorrection(options.sphereCorrection, group);

    // rotate the new sphere to make the target position face the camera
    if (positionProvided) {
      const cleanPosition = this.psv.dataHelper.cleanPosition(options);
      const currentPosition = this.psv.getPosition();

      // Longitude rotation along the vertical axis
      const verticalAxis = new THREE.Vector3(0, 1, 0);
      group.rotateOnWorldAxis(verticalAxis, cleanPosition.longitude - currentPosition.longitude);

      // Latitude rotation along the camera horizontal axis
      const horizontalAxis = new THREE.Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new THREE.Vector3())).normalize();
      group.rotateOnWorldAxis(horizontalAxis, cleanPosition.latitude - currentPosition.latitude);
    }

    group.add(mesh);
    this.scene.add(group);
    this.psv.needsUpdate();

    return new Animation({
      properties: {
        opacity: { start: 0.0, end: 1.0 },
        zoom   : zoomProvided ? { start: this.psv.getZoomLevel(), end: options.zoom } : undefined,
      },
      duration  : options.transition,
      easing    : 'outCubic',
      onTick    : (properties) => {
        this.psv.adapter.setTextureOpacity(mesh, properties.opacity);

        if (zoomProvided) {
          this.psv.zoom(properties.zoom);
        }

        this.psv.needsUpdate();
      },
    })
      .then(() => {
        // remove temp sphere and transfer the texture to the main sphere
        this.setTexture(textureData);
        this.setPanoramaPose(options.panoData);
        this.setSphereCorrection(options.sphereCorrection);

        this.scene.remove(group);
        mesh.geometry.dispose();
        mesh.geometry = null;

        // actually rotate the camera
        if (positionProvided) {
          this.psv.rotate(options);
        }
      });
  }

  /**
   * @summary Calls `dispose` on all objects and textures
   * @param {external:THREE.Object3D} object
   * @private
   */
  __cleanTHREEScene(object) {
    object.traverse((item) => {
      if (item.geometry) {
        item.geometry.dispose();
      }

      if (item.material) {
        if (Array.isArray(item.material)) {
          item.material.forEach((material) => {
            if (material.map) {
              material.map.dispose();
            }

            material.dispose();
          });
        }
        else {
          if (item.material.map) {
            item.material.map.dispose();
          }

          item.material.dispose();
        }
      }

      if (item.dispose && !(item instanceof THREE.Scene)) {
        item.dispose();
      }

      if (item !== object) {
        this.__cleanTHREEScene(item);
      }
    });
  }

}
