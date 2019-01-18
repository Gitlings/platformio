const UI_STATES = {
  BUILDER: Symbol('builder'),
  BUILDER_UI: Symbol('builder ui'),
  PLAYER: Symbol('player'),
};

const UI_INPUT_ACTIONS = {
  [UI_STATES.BUILDER]: {
    PLACE_OBJECT: Symbol('Place object'),
    CAMERA_UP: Symbol('Camera up'),
    CAMERA_LEFT: Symbol('Camera left'),
    CAMERA_DOWN: Symbol('Camera down'),
    CAMERA_RIGHT: Symbol('Camera right'),
    SWITCH_MODE: Symbol('Switch to Player mode'),
  },
  [UI_STATES.BUILDER_UI]: {
    SWITCH_MODE: Symbol('Switch to Player mode'),
  },
  [UI_STATES.PLAYER]: {
    PLAYER_UP: Symbol('Player up'),
    PLAYER_LEFT: Symbol('Player left'),
    PLAYER_DOWN: Symbol('Player down'),
    PLAYER_RIGHT: Symbol('Player right'),
    SWITCH_MODE: Symbol('Switch to Builder mode'),
  },
};

const LEFT_MOUSE_CLICK = 'leftMouseClick';

/**
 * @param {CameraController} cameraController
 * @param {BuilderController} builderController
 * @param {PlayerController} playerController
 * @param {UiManager} uiManager
 * @constructor
 */
function UiInputActions(cameraController, builderController, playerController, uiManager) {
  const actions = new Map();
  const builderActions = UI_INPUT_ACTIONS[UI_STATES.BUILDER];
  const playerActions = UI_INPUT_ACTIONS[UI_STATES.PLAYER];

  // TODO: move this out to UI framework store.
  let currentUiState = UI_STATES.PLAYER;

  initialize();

  this.emitKeyDown = (event) => {
    const stateActions = actions.get(currentUiState);
    const action = stateActions.get(event.code);
    if (typeof action === 'undefined') {
      return;
    }

    if (typeof action.onKeyPress === 'function') {
      action.onKeyPress();
    } else if (typeof action.onKeyDown === 'function') {
      action.onKeyDown();
    }
  };

  this.emitKeyUp = (event) => {
    const stateActions = actions.get(currentUiState);
    const action = stateActions.get(event.code);
    if (typeof action === 'undefined') {
      return;
    }

    if (typeof action.onKeyUp === 'function') {
      action.onKeyUp();
    }
  };

  this.emitMouseClick = (event) => {
    const stateActions = actions.get(currentUiState);
    const action = stateActions.get(LEFT_MOUSE_CLICK);
    if (typeof action === 'undefined') {
      return;
    }

    if (typeof action.onClick === 'function') {
      action.onClick(event);
    }
  };

  // BUILDER ACTIONS.

  defineLeftMouseClickAction(UI_STATES.BUILDER, {
    action: builderActions.PLACE_OBJECT,
    onClick: () => builderController.placeObject(),
  });

  defineKeyHoldAction(UI_STATES.BUILDER, 'KeyW', {
    action: builderActions.CAMERA_UP,
    onKeyDown: () => cameraController.setMovementDirection('up', true),
    onKeyUp: () => cameraController.setMovementDirection('up', false),
  });

  defineKeyHoldAction(UI_STATES.BUILDER, 'KeyA', {
    action: builderActions.CAMERA_LEFT,
    onKeyDown: () => cameraController.setMovementDirection('left', true),
    onKeyUp: () => cameraController.setMovementDirection('left', false),
  });

  defineKeyHoldAction(UI_STATES.BUILDER, 'KeyS', {
    action: builderActions.CAMERA_DOWN,
    onKeyDown: () => cameraController.setMovementDirection('down', true),
    onKeyUp: () => cameraController.setMovementDirection('down', false),
  });

  defineKeyHoldAction(UI_STATES.BUILDER, 'KeyD', {
    action: builderActions.CAMERA_RIGHT,
    onKeyDown: () => cameraController.setMovementDirection('right', true),
    onKeyUp: () => cameraController.setMovementDirection('right', false),
  });

  defineKeyPressAction(UI_STATES.BUILDER, 'Escape', {
    action: builderActions.SWITCH_MODE,
    onKeyPress: () => {
      currentUiState = UI_STATES.PLAYER;
      uiManager.activatePlayerMode();
    },
  });

  // PLAYER ACTIONS.

  defineKeyHoldAction(UI_STATES.PLAYER, 'KeyW', {
    action: playerActions.PLAYER_UP,
    onKeyDown: () => playerController.setMovementDirection('up', true),
    onKeyUp: () => playerController.setMovementDirection('up', false),
  });

  defineKeyHoldAction(UI_STATES.PLAYER, 'KeyA', {
    action: playerActions.PLAYER_LEFT,
    onKeyDown: () => playerController.setMovementDirection('left', true),
    onKeyUp: () => playerController.setMovementDirection('left', false),
  });

  defineKeyHoldAction(UI_STATES.PLAYER, 'KeyS', {
    action: playerActions.PLAYER_DOWN,
    onKeyDown: () => playerController.setMovementDirection('down', true),
    onKeyUp: () => playerController.setMovementDirection('down', false),
  });

  defineKeyHoldAction(UI_STATES.PLAYER, 'KeyD', {
    action: playerActions.PLAYER_RIGHT,
    onKeyDown: () => playerController.setMovementDirection('right', true),
    onKeyUp: () => playerController.setMovementDirection('right', false),
  });

  defineKeyPressAction(UI_STATES.PLAYER, 'Escape', {
    action: playerActions.SWITCH_MODE,
    onKeyPress: () => {
      currentUiState = UI_STATES.BUILDER;
      uiManager.activateBuilderMode();
    },
  });

  function initialize() {
    for (const state of Object.values(UI_STATES)) {
      actions.set(state, new Map());
    }
  }

  /**
   * @param {Symbol} uiState
   * @param {string} keyCode
   * @param actionCallback
   */
  function defineKeyHoldAction(uiState, keyCode, actionCallback) {
    const stateActions = actions.get(uiState);
    if (stateActions.has(keyCode)) {
      const uiStateDescription = String(uiState).slice(7, -1) || null;
      throw new Error(`Can't redefine ${keyCode} for '${uiStateDescription}' state`);
    }
    if (typeof actionCallback.onKeyDown !== 'function') {
      throw new Error('onKeyDown callback function is not set');
    }
    if (typeof actionCallback.onKeyUp !== 'function') {
      throw new Error('onKeyUp callback function is not set');
    }
    if (typeof actionCallback.onKeyPress !== 'undefined') {
      actionCallback.onKeyPress = undefined;
    }
    stateActions.set(keyCode, actionCallback);
  }

  /**
   * @param {Symbol} uiState
   * @param {string} keyCode
   * @param actionCallback
   */
  function defineKeyPressAction(uiState, keyCode, actionCallback) {
    const stateActions = actions.get(uiState);
    if (stateActions.has(keyCode)) {
      const uiStateDescription = String(uiState).slice(7, -1) || null;
      throw new Error(`Can't redefine ${keyCode} for '${uiStateDescription}' state`);
    }
    if (typeof actionCallback.onKeyDown !== 'undefined') {
      actionCallback.onKeyDown = undefined;
    }
    if (typeof actionCallback.onKeyUp !== 'undefined') {
      actionCallback.onKeyUp = undefined;
    }
    if (typeof actionCallback.onKeyPress !== 'function') {
      throw new Error('onKeyPress callback function is not set');
    }
    stateActions.set(keyCode, actionCallback);
  }

  /**
   * @param {Symbol} uiState
   * @param actionCallback
   */
  function defineLeftMouseClickAction(uiState, actionCallback) {
    const keyCode = LEFT_MOUSE_CLICK;
    const stateActions = actions.get(uiState);
    if (stateActions.has(keyCode)) {
      const uiStateDescription = String(uiState).slice(7, -1) || null;
      throw new Error(`Can't redefine ${keyCode} for '${uiStateDescription}' state`);
    }
    stateActions.set(keyCode, actionCallback);
  }
}

export default UiInputActions;
