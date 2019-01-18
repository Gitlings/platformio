import RustCommon from '../../rust_common/Cargo.toml';

import SystemInterface from '../Interfaces/SystemInterface';
import SpawnPlayerAction from '../Actions/SpawnPlayerAction';
import DespawnPlayerAction from '../Actions/DespawnPlayerAction';
import { replaying } from '../Utils/SystemHelpers';
import DespawnClientPlayerAction from '../Actions/DespawnClientPlayerAction';
import ActivePlayersRegistry from '../Registries/ActivePlayersRegistry';
import EngineConfig from '../EngineConfig';

/**
 * @param {GameSceneSnapshots} gameSceneSnapshots
 * @param {PlayerModel} playerModel
 * @constructor
 */
function PlayerSystem(gameSceneSnapshots, playerModel) {
  const actionProcessors = new Map([
    [SpawnPlayerAction, spawnPlayer],
    [DespawnPlayerAction, despawnPlayer],
    [DespawnClientPlayerAction, despawnClientPlayers],
  ]);

  this.systemInterface = new SystemInterface(this, {
    canProcess: action => actionProcessors.has(action.constructor),

    process: action => actionProcessors.get(action.constructor)(action),
  });

  /**
   * @param {SpawnPlayerAction} action
   */
  function spawnPlayer(action) {
    const gameScene = gameSceneSnapshots.getCurrent();
    if (EngineConfig.isServer() && !action.getClientId()) {
      action.setClientId(action.actionInterface.senderId);
    }
    gameScene.addPlayer(action.getClientId(), action.getPlayer());
    RustCommon.addPlayer(action.getPlayer());
  }

  /**
   * @param {DespawnPlayerAction} action
   */
  function despawnPlayer(action) {
    const gameScene = gameSceneSnapshots.getCurrent();
    gameScene.removePlayer(action.getPlayerHashId());
  }

  /**
   * @param {DespawnClientPlayerAction} action
   */
  function despawnClientPlayers(action) {
    const gameScene = gameSceneSnapshots.getCurrent();
    const clientId = action.getClientId();
    gameScene.removePlayerByClientId(clientId);

    ActivePlayersRegistry.removePlayerWithId(clientId);
  }
}

export default PlayerSystem;
