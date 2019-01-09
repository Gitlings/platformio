import Bottle from 'bottlejs';
import ActionController from './Controllers/ActionController';
import NetworkMessageSystem from './Systems/NetworkMessageSystem';
import BuildableObjectSystem from './Systems/BuildableObjectSystem';
import GameScene from './Models/GameScene';
import PlayerModel from './Models/PlayerModel';
import MovementSystem from './Systems/MovementSystem';
import PlayerSystem from './Systems/PlayerSystem';
import GameState from './Models/GameState';
import BroadcastedActionsQueue from './Models/BroadcastedActionsQueue';

const bottle = new Bottle();

/**
 * @callback PourService
 * @param {Function} serviceConstructor
 * @param {...Function} dependencies
 */

/**
 * @param {string=} prefix
 * @return {PourService}
 */
function createPourService(prefix = '') {
  return (serviceConstructor, ...dependencies) => {
    serviceConstructor.toString = () => serviceConstructor.name; // DEUS VULT!
    serviceConstructor.serviceName = prefix + serviceConstructor.name;

    bottle.service(
      prefix + serviceConstructor.name,
      serviceConstructor,
      ...dependencies.map((constructor) => {
        if (typeof constructor !== 'function') {
          return constructor.constructor.serviceName;
        }
        return constructor.serviceName;
      }),
    );
  };
}

const pourCommonService = createPourService('common.');

// Models.
pourCommonService(GameScene);
pourCommonService(GameState, GameScene);
pourCommonService(PlayerModel);
pourCommonService(BroadcastedActionsQueue);

// Systems as Controllers dependencies.
pourCommonService(BuildableObjectSystem, GameScene, PlayerModel);
pourCommonService(MovementSystem, GameScene, PlayerModel, BroadcastedActionsQueue);
pourCommonService(PlayerSystem, GameScene, PlayerModel);
// Controllers.
pourCommonService(
  ActionController,
  GameScene,
  BuildableObjectSystem,
  MovementSystem,
  PlayerSystem,
  BroadcastedActionsQueue,
);

// Systems.
pourCommonService(NetworkMessageSystem, ActionController);


const { common } = bottle.container;
/**
 * @constructor
 */
const CommonMuddle = new Proxy({}, {
  get: (_obj, serviceConstructor) => common[serviceConstructor],
});

/**
 * @callback MuddleInitializer
 * @param common
 * @param {PourService} pourService
 */

/**
 * @param {MuddleInitializer} muddleInitializer
 */
export function initializeMuddle(muddleInitializer) {
  muddleInitializer(CommonMuddle, createPourService());

  return new Proxy({}, {
    get: (_obj, serviceConstructor) => {
      if (serviceConstructor === 'common') {
        return CommonMuddle;
      }
      return bottle.container[serviceConstructor];
    },
  });
}

export default CommonMuddle;
