import * as THREE from 'three';
import UpdatableInterface from 'common/Interfaces/UpdatableInterface';
import { GAMEPLAY_UPDATE_INTERVAL_SECS } from 'common/Constants';
import MovementDirections from '../Utils/MovementDirections';

/**
 * @param {CameraWrapper} cameraWrapper
 * @param {CanvasWrapper} canvasWrapper
 * @constructor
 */
function CameraController(cameraWrapper, canvasWrapper) {
  // INTERFACES IMPLEMENTATION.
  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {
      cameraWrapper.updateCameraSize(new THREE.Vector2(), canvasWrapper.getCanvasSize());
      moveCamera();
    },
  });

  const movingDirections = new MovementDirections();

  this.setMovementDirection = (direction, enable) => {
    movingDirections[direction] = enable;
  };

  const CAMERA_SPEED = 150;

  function moveCamera() {
    const offsetVector = movingDirections
      .getDirectionVector()
      .clone()
      .multiplyScalar(CAMERA_SPEED * GAMEPLAY_UPDATE_INTERVAL_SECS);
    const newPosition = cameraWrapper.getPosition().clone().add(offsetVector);
    cameraWrapper.setPosition(newPosition);
  }
}

export default CameraController;
