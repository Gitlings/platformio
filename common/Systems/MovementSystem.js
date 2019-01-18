import RustCommon from '../../rust_common/Cargo.toml';

import SystemInterface from '../Interfaces/SystemInterface';
import PlayerSetMovingAction from '../Actions/PlayerSetMovingAction';
import UpdatableInterface from '../Interfaces/UpdatableInterface';
import { replaying } from '../Utils/SystemHelpers';
import EngineConfig from '../EngineConfig';

/**
 * @param {GameSceneSnapshots} gameSceneSnapshots
 * @param {PlayerModel} playerModel
 * @param {BroadcastedActionsQueue} broadcastedActionsQueue
 * @constructor
 */
function MovementSystem(gameSceneSnapshots, playerModel, broadcastedActionsQueue) {
  const actionPreprocessors = new Map([
    [PlayerSetMovingAction, preprocessPlayerSetMoving],
  ]);
  const actionProcessors = new Map([
    [PlayerSetMovingAction, playerSetMoving],
  ]);

  this.systemInterface = new SystemInterface(this, {
    canProcess: action => actionProcessors.has(action.constructor),

    lagCompensate: action => actionPreprocessors.get(action.constructor)(action),

    process: action => actionProcessors.get(action.constructor)(action),
  });

  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {
      const gameScene = gameSceneSnapshots.getCurrent();
      const players = gameScene.getAllPlayers();
      const objects = gameScene.getAllBuildableObjects();
      RustCommon.processPlayersMovement(players, objects);
    },
  });

  /**
   * @param {PlayerSetMovingAction} action
   */
  function preprocessPlayerSetMoving(action) {
  }

  /**
   * @param {PlayerSetMovingAction} action
   */
  function playerSetMoving(action) {
    const gameScene = gameSceneSnapshots.getCurrent();
    const player = gameScene.getPlayer(action.getPlayerHashId());
    if (player) {
      let playedAction = action;
      if (EngineConfig.isServer()) {
        playedAction = new PlayerSetMovingAction(
          action.getPlayerHashId(),
          player.placeableObjectInterface.getPosition(),
          action.getDirection(),
          action.actionInterface.tickOccurred,
          action.actionInterface.senderId,
          action.actionInterface.clientActionId,
        );
      }
      broadcastedActionsQueue.addAction(playedAction);

      if (EngineConfig.isClient()) {
        // console.log('erm');
        player.placeableObjectInterface.setPosition(playedAction.getPosition());
      }
      player.movementDirection = playedAction.getDirection();
    }
  }
}

export default MovementSystem;
