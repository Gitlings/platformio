import * as THREE from 'three';

import GameSceneSnapshots from 'common/Models/GameSceneSnapshots';

import CircleRenderer from './Renderers/CircleRenderer';
import PlayerRenderer from './Renderers/PlayerRender';
import RectangleRenderer from './Renderers/RectangleRenderer';
import ClientMuddle from '../ClientMuddle';
import CameraWrapper from './Models/CameraWrapper';
import CanvasWrapper from './Models/CanvasWrapper';

const objectRendererConstructors = {
  circle: CircleRenderer,
  player: PlayerRenderer,
  rectangle: RectangleRenderer,
};

/**
 * @param {WebGLRenderer} renderer
 * @constructor
 */
function Renderer(renderer) {
  /**
   * @type CameraWrapper
   */
  const cameraWrapper = ClientMuddle[CameraWrapper];

  /**
   * @type CanvasWrapper
   */
  const canvasWrapper = ClientMuddle[CanvasWrapper];

  /**
   * @type GameSceneSnapshots
   */
  const gameSceneSnapshots = ClientMuddle.common[GameSceneSnapshots];

  const scene = new THREE.Scene();

  this.render = () => {
    updateRendererSize();
    updateMeshes();
    renderer.render(scene, cameraWrapper.getCamera());
  };

  renderer.setClearColor(new THREE.Color(0xEFEFEF));

  /**
   * @type {Map<string, Mesh>}
   */
  const objectRenderers = new Map();

  function updateRendererSize() {
    const { x: width, y: height } = canvasWrapper.getCanvasSize();
    if (renderer.domElement.width !== width || renderer.domElement.height !== width) {
      renderer.setSize(width, height, false);
    }
  }

  function updateMeshes() {
    const gameScene = gameSceneSnapshots.getCurrentReadOnly();
    if (!gameScene) {
      return;
    }

    for (const object of gameScene.getAllObjects()) {
      const hashId = object.hashableIdInterface.getHashId();
      if (!objectRenderers.has(hashId)) {
        const objectRenderer = createObjectRenderer(object);
        if (objectRenderer !== null) {
          objectRenderers.set(hashId, objectRenderer);
          objectRenderer.objectRendererInterface.initialize(object);
          scene.add(objectRenderer.objectRendererInterface.getRootMesh());
        }
      }
    }

    for (const [hashId, objectRenderer] of objectRenderers) {
      const object = gameScene.getObject(hashId);
      if (object) {
        objectRenderer.objectRendererInterface.renderUpdate(object);
      } else {
        scene.remove(objectRenderer.objectRendererInterface.getRootMesh());
        objectRenderers.delete(hashId);
      }
    }
  }

  function createObjectRenderer(object) {
    const ObjectRenderer = objectRendererConstructors[object.placeableObjectInterface.getType()];
    if (typeof ObjectRenderer !== 'undefined') {
      return new ObjectRenderer();
    }

    console.warn(`No renderer available for type '
      ${object.placableObjectInterface.getType()}
      ': Object("
      ${object.hashableIdInterface.getHashId()}
      ')`);

    return null;
  }
}

export default Renderer;
