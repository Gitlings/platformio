import SystemInterface from 'common/Interfaces/SystemInterface';
import AuthenticationResponseMessage from 'common/NetworkMessages/AuthenticationResponseMessage';
import InitializeGameMessage from 'common/NetworkMessages/InitializeGameMessage';
import SpawnPlayerAction from 'common/Actions/SpawnPlayerAction';
import SaveBuildableObjectAction from 'common/Actions/SaveBuildableObjectAction';
import PingMessage from 'common/NetworkMessages/PingMessage';
import PongMessage from 'common/NetworkMessages/PongMessage';
import { send } from 'common/Utils/NetworkUtils';
import BroadcastPlayersLatencyMessage from 'common/NetworkMessages/BroadcastPlayersLatencyMessage';
import PlayerLoggedInMessage from 'common/NetworkMessages/PlayerLoggedInMessage';
import PlayerLoggedOutMessage from 'common/NetworkMessages/PlayerLoggedOutMessage';
import ActivePlayersRegistry from 'common/Registries/ActivePlayersRegistry';
import { SERVER_SENDER_ID } from 'common/Constants';
import GameUpdateMessage from 'common/NetworkMessages/GameUpdateMessage';
import GameScene from 'common/Models/GameScene';
import { log } from 'common/Utils/Debug';

/**
 * @param {UiManager} uiManager
 * @param {ActionController} actionController
 * @param {PlayerModel} playerModel
 * @param {GameState} gameState
 * @param {GameSceneSnapshots} gameSceneSnapshots
 * @param {Store} vuexStore
 * @constructor
 */
function ClientNetworkMessageSystem(
  uiManager,
  actionController,
  playerModel,
  gameState,
  gameSceneSnapshots,
  vuexStore,
) {
  let ws;

  const parameters = { playerModel };
  const messageProcessors = new Map([
    [AuthenticationResponseMessage, processAuthenticationResponse],
    [BroadcastPlayersLatencyMessage, processBroadcastPlayersLatencyMessage],
    [InitializeGameMessage, processInitializeMessage],
    [GameUpdateMessage, processGameUpdateMessage],
    [PingMessage, processPingMessage],
    [PlayerLoggedInMessage, processPlayerLoggedInMessage],
    [PlayerLoggedOutMessage, processPlayerLoggedOutMessage],
  ]);

  this.setWebSocket = (webSocket) => {
    ws = webSocket;
  };

  this.systemInterface = new SystemInterface(this, {
    canProcess: message => messageProcessors.has(message.constructor),

    process: message => messageProcessors.get(message.constructor)(message),
  });

  /**
   * @param {AuthenticationResponseMessage} message
   */
  function processAuthenticationResponse(message) {
    const player = parameters.playerModel;
    player.clientId = message.getResponse();
    if (typeof message.getResponse() === 'number') {
      ActivePlayersRegistry.registerPlayer(player);
      vuexStore.commit('players/addPlayer', player);
      player.authenticated = true;
      localStorage.setItem('displayName', player.displayName);
    }
  }

  /**
   * @param {BroadcastPlayersLatencyMessage} message
   */
  function processBroadcastPlayersLatencyMessage(message) {
    for (const [clientId, latency] of Object.entries(message.getPlayersLatency())) {
      ActivePlayersRegistry.getPlayerById(parseInt(clientId, 10)).latency = latency;
    }
  }

  /**
   * @param {InitializeGameMessage} message
   */
  function processInitializeMessage(message) {
    const gameScene = new GameScene();
    gameState.serverTick = message.getServerTick();
    gameState.lagCompensatedTick = gameState.serverTick;
    gameState.currentTick = gameState.serverTick;
    gameScene.currentTick = gameState.serverTick;
    for (const player of message.getActivePlayers()) {
      ActivePlayersRegistry.registerPlayer(player);
      vuexStore.commit('players/addPlayer', player);
    }
    for (const [clientIdStr, playerObject] of Object.entries(message.getPlayerObjects())) {
      const clientId = parseInt(clientIdStr, 10);
      const action = new SpawnPlayerAction(playerObject, clientId, null, SERVER_SENDER_ID);
      actionController.addAction(action);
    }
    for (const buildableObject of message.getBuildableObjects()) {
      const action = new SaveBuildableObjectAction(buildableObject, null, SERVER_SENDER_ID);
      actionController.addAction(action);
    }
    for (const action of message.getActions()) {
      actionController.addAction(action);
    }
    uiManager.activatePlayerMode();

    gameSceneSnapshots.setCurrent(gameScene);
    gameSceneSnapshots.addSnapshot(gameScene.currentTick, gameScene);

    log(`Processed InitializeGameMessage. Server tick: ${gameState.serverTick}`);
  }

  /**
   * @param {GameUpdateMessage} message
   */
  function processGameUpdateMessage(message) {
    for (const action of message.getActions()) {
      actionController.addAction(action);
    }
    gameState.previousServerTick = message.getPreviousServerTick();
    gameState.serverTick = message.getServerTick();
  }

  /**
   * @param {PingMessage} message
   */
  function processPingMessage(message) {
    parameters.playerModel.latency = message.getLastLatency();
    const pongMessage = new PongMessage(message.getPingId());
    send(ws, pongMessage);
  }

  /**
   * @param {PlayerLoggedInMessage} message
   */
  function processPlayerLoggedInMessage(message) {
    const player = message.getPlayer();
    player.authenticated = true;
    vuexStore.commit('players/addPlayer', player);
    ActivePlayersRegistry.registerPlayer(player);
  }

  /**
   * @param {PlayerLoggedOutMessage} message
   */
  function processPlayerLoggedOutMessage(message) {
    // We actually remove the player on DespawnClientPlayerAction.
    const player = ActivePlayersRegistry.getPlayerById(message.getClientId());
    vuexStore.commit('players/removePlayerWithId', player.clientId);
    player.online = false;
  }
}

export default ClientNetworkMessageSystem;
