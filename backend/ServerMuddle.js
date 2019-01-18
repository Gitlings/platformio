import { initializeMuddle } from 'common/Muddle';

import ActionController from 'common/Controllers/ActionController';
import BroadcastedActionsQueue from 'common/Models/BroadcastedActionsQueue';
import GameSceneSnapshots from 'common/Models/GameSceneSnapshots';
import GameState from 'common/Models/GameState';

import ServerNetworkController from './Controllers/ServerNetworkController';

/**
 * @constructor
 */
const ServerMuddle = initializeMuddle((common, pourService) => {
  // Controllers.
  pourService(
    ServerNetworkController,
    common[ActionController],
    common[GameState],
    common[GameSceneSnapshots],
    common[BroadcastedActionsQueue],
  );
});

/**
 * @type ActionController
 */
const actionController = ServerMuddle.common[ActionController];
actionController.setNetworkController(ServerMuddle[ServerNetworkController]);

export default ServerMuddle;
