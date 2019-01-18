import { initializeMuddle } from 'common/Muddle';
import ActionController from 'common/Controllers/ActionController';
import PlayerModel from 'common/Models/PlayerModel';
import GameSceneSnapshots from 'common/Models/GameSceneSnapshots';
import GameState from 'common/Models/GameState';

import StoreMuddle from './StoreMuddle';
import CameraWrapper from './game/Models/CameraWrapper';
import CanvasWrapper from './game/Models/CanvasWrapper';
import BuilderController from './game/Controllers/BuilderController';
import CameraController from './game/Controllers/CameraController';
import ClientNetworkController from './game/Controllers/ClientNetworkController';
import MainUiController from './game/Controllers/MainUiController';
import PlayerController from './game/Controllers/PlayerController';
import UiManager from './game/UiManager';
import ClientNetworkMessageSystem from './game/Systems/ClientNetworkMessageSystem';
import VuexStore from './VuexStore';

/**
 * @constructor
 */
const ClientMuddle = initializeMuddle((common, pourService) => {
  // Models.
  pourService(CameraWrapper);
  pourService(CanvasWrapper);

  // Miscellaneous.
  pourService(BuilderController, common[ActionController], CanvasWrapper);
  pourService(PlayerController, common[ActionController], CameraWrapper, common[PlayerModel]);
  pourService(VuexStore);
  pourService(UiManager, PlayerController, BuilderController, VuexStore);

  // Systems.
  pourService(
    ClientNetworkMessageSystem,
    UiManager,
    common[ActionController],
    common[PlayerModel],
    common[GameState],
    common[GameSceneSnapshots],
    VuexStore,
  );

  // Controllers.
  pourService(CameraController, CameraWrapper, CanvasWrapper);
  pourService(ClientNetworkController, ClientNetworkMessageSystem, common[ActionController]);
  pourService(
    MainUiController,
    common[ActionController],
    CameraWrapper,
    CanvasWrapper,
    BuilderController,
    PlayerController,
    UiManager,
  );
});

/**
 * @type ActionController
 */
const actionController = ClientMuddle.common[ActionController];
actionController.setNetworkController(ClientMuddle[ClientNetworkController]);

StoreMuddle(ClientMuddle);

export default ClientMuddle;
