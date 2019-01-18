import UpdatableInterface from 'common/Interfaces/UpdatableInterface';
import CameraController from './CameraController';
import UiInputActions from '../Utils/UiInputActions';

/**
 * @param {ActionController} actionController
 * @param {CameraWrapper} cameraWrapper
 * @param {CanvasWrapper} canvasWrapper
 * @param {BuilderController} builderController
 * @param {PlayerController} playerController
 * @param {UiManager} uiManager
 * @constructor
 */
function MainUiController(
  actionController,
  cameraWrapper,
  canvasWrapper,
  builderController,
  playerController,
  uiManager,
) {
  const canvas = canvasWrapper.getCanvas();

  const cameraController = new CameraController(cameraWrapper, canvasWrapper);

  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {
      cameraController.updatableInterface.update();
      canvasWrapper.updateWorldMousePosition(cameraWrapper);
      builderController.updatableInterface.update();
      playerController.updatableInterface.update();
    },
  });

  const uiInputActions = new UiInputActions(
    cameraController,
    builderController,
    playerController,
    uiManager,
  );

  canvas.addEventListener('mousemove', (event) => {
    canvasWrapper.registerMousePosition(event);
  });

  document.addEventListener('keydown', (event) => {
    uiInputActions.emitKeyDown(event);
  });

  document.addEventListener('keyup', (event) => {
    uiInputActions.emitKeyUp(event);
  });

  canvas.addEventListener('click', (event) => {
    uiInputActions.emitMouseClick(event);
  });
}

export default MainUiController;
