import CommonMuddle from './Muddle';

import { log } from './Utils/Debug';
import EngineConfig from './EngineConfig';
import GlobalPsonDictionary from './Utils/GlobalPsonDictionary';

import ActionController from './Controllers/ActionController';
import GameState from './Models/GameState';
import { MAX_TICKS_WITHOUT_SERVER } from './Constants';

/**
 * @param {boolean} isServer
 * @constructor
 */
function Engine(isServer) {
  EngineConfig.initialize(isServer);
  log('Debug mode is enabled');
  GlobalPsonDictionary.commitDictionary();
  log(`Committed ${GlobalPsonDictionary.getDictionaryLength()} words to GlobalPsonDictionary`);

  /**
   * @type ActionController
   */
  const actionController = CommonMuddle[ActionController];

  /**
   * @type GameState
   */
  const gameState = CommonMuddle[GameState];

  this.tick = () => {
    const maxTick = gameState.serverTick + MAX_TICKS_WITHOUT_SERVER;
    if (EngineConfig.isClient() && gameState.currentTick > maxTick) {
      return false;
    }
    actionController.updatableInterface.update();
    gameState.lagCompensatedTick += 1;
    if (gameState.currentTick < gameState.lagCompensatedTick) {
      gameState.currentTick += 1;
    }
    return true;
  };
}

export default Engine;
