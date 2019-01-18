import UpdatableInterface from '../Interfaces/UpdatableInterface';
import EngineConfig from '../EngineConfig';
import { GAMEPLAY_UPDATE_INTERVAL, LAG_COMPENSATION_THRESHOLD } from '../Constants';
import { replaying } from '../Utils/SystemHelpers';
import { copy } from '../Utils/CopyableHelpers';

/**
 * @param {GameState} gameState
 * @param {GameSceneSnapshots} gameSceneSnapshots
 * @param {BuildableObjectSystem} buildableObjectSystem
 * @param {MovementSystem} movementSystem
 * @param {PlayerSystem} playerSystem
 * @param {BroadcastedActionsQueue} broadcastedActionsQueue
 * @param {PlayerModel} playerModel
 *
 * @constructor
 */
function ActionController(
  gameState,
  gameSceneSnapshots,
  buildableObjectSystem,
  movementSystem,
  playerSystem,
  broadcastedActionsQueue,
  playerModel,
) {
  let actionCounter = 0;
  const actionsQueue = [];
  let networkController = null;

  const systems = {
    buildableObjectSystem,
    movementSystem,
    playerSystem,
  };

  // INTERFACES IMPLEMENTATION.
  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {
      if (!gameSceneSnapshots.getCurrent()) {
        return;
      }

      if (gameState.lagCompensatedTick < gameSceneSnapshots.getCurrent().currentTick) {
        const snapshot = gameSceneSnapshots.getSnapshot(gameState.lagCompensatedTick)
          || gameSceneSnapshots.getSnapshot(gameState.currentTick);
        gameSceneSnapshots.setCurrent(copy(snapshot));
      }

      const gameScene = gameSceneSnapshots.getCurrent();

      const actions = getCurrentTickActions();
      for (const action of actions) {
        for (const systemKey of Object.keys(systems)) {
          const system = systems[systemKey];
          if (system.systemInterface.canProcess(action)) {
            system.systemInterface.process(action);
          }
        }
      }

      systems.movementSystem.updatableInterface.update();

      for (const action of actions) {
        const isNotBroadcastedYet = action.actionInterface.isBroadcastedAfterExecution()
          && !action.actionInterface.isManagedBySystem();
        if (isNotBroadcastedYet && !action.actionInterface.hasBeenBroadcasted) {
          broadcastedActionsQueue.addAction(action);
        }
      }

      if (EngineConfig.isClient()) {
        for (const action of broadcastedActionsQueue.getActions()) {
          networkController.networkControllerInterface.broadcastAction(action);
        }
        broadcastedActionsQueue.clearActions();
      }

      // Clear old data.
      gameSceneSnapshots.removeSnapshotsOlder(Math.min(
        gameState.lagCompensatedTick,
        gameState.previousServerTick,
      ));
      dropOldActions();

      gameScene.currentTick += 1;
      gameSceneSnapshots.addSnapshot(gameState.lagCompensatedTick + 1, gameScene);
    },
  });

  // CLASS IMPLEMENTATION.
  this.setNetworkController = (newNetworkController) => {
    networkController = newNetworkController;
  };

  this.addAction = (action) => {
    if (action.actionInterface.tickOccurred === null) {
      action.actionInterface.tickOccurred = gameState.currentTick;
      if (EngineConfig.isClient()) {
        action.actionInterface.clientActionId = actionCounter;
      }
    }
    lagCompensate(action);
    action.actionInterface.internalActionId = actionCounter;
    actionCounter += 1;

    actionsQueue.push(action);

    if (action.actionInterface.hasBeenBroadcasted) {
      return;
    }

    if (!action.actionInterface.isBroadcastedAfterExecution()) {
      networkController.networkControllerInterface.broadcastAction(action);
    } else if (!action.actionInterface.isManagedBySystem()) {
      const clientReplaying = EngineConfig.isClient() && replaying(action, playerModel);
      if (!clientReplaying) {
        broadcastedActionsQueue.addAction(action);
      }
    }
  };

  function getCurrentTickActions() {
    actionsQueue.sort(actionCompare);
    const currentTick = gameState.lagCompensatedTick;

    const start = actionsQueue.findIndex(
      action => action.actionInterface.tickOccurred === currentTick,
    );
    if (start === -1) {
      return [];
    }

    const end = actionsQueue.findIndex(
      action => action.actionInterface.tickOccurred > currentTick,
    );
    return actionsQueue.slice(start, end === -1 ? actionsQueue.length : end);
  }

  function dropOldActions() {
    actionsQueue.sort(actionCompare);
    const actionsToRemove = actionsQueue.findIndex(action => (
      action.actionInterface.tickOccurred > gameState.previousServerTick &&
        action.actionInterface.tickOccurred < gameState.lagCompensatedTick
    ));
    actionsQueue.splice(0, actionsToRemove === -1 ? 0 : actionsToRemove);
  }

  function lagCompensate(action) {
    if (EngineConfig.isServer()) {
      const tdiff = new Date() - gameState.lastServerUpdateTime;
      const tleft = LAG_COMPENSATION_THRESHOLD - tdiff;
      const tickLate = gameState.serverTick - action.actionInterface.tickOccurred;
      if (tickLate * GAMEPLAY_UPDATE_INTERVAL > tleft) {
        const ticksAfter = Math.ceil(tleft / GAMEPLAY_UPDATE_INTERVAL);
        action.actionInterface.tickOccurred = gameState.previousServerTick + ticksAfter;
      }
    }

    const actionTickOccurred = action.actionInterface.tickOccurred;
    if (action.actionInterface.tickOccurred < gameState.lagCompensatedTick) {
      gameState.lagCompensatedTick = actionTickOccurred;
    }
  }
}

function actionCompare(actionA, actionB) {
  const tickOccurredA = actionA.actionInterface.tickOccurred;
  const tickOccurredB = actionB.actionInterface.tickOccurred;
  const tickD = tickOccurredA - tickOccurredB;
  if (tickD !== 0) {
    return tickD;
  }

  const idA = actionA.actionInterface.internalActionId;
  const idB = actionB.actionInterface.internalActionId;
  const d = idA - idB;
  if (d !== 0) {
    return d;
  }

  return 0;
}

export default ActionController;
