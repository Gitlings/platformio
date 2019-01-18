import wu from 'wu';

import SystemInterface from 'common/Interfaces/SystemInterface';
import PongMessage from 'common/NetworkMessages/PongMessage';
import ActivePlayersRegistry from 'common/Registries/ActivePlayersRegistry';
import { log } from 'common/Utils/Debug';
import UpdatableInterface from 'common/Interfaces/UpdatableInterface';
import PingMessage from 'common/NetworkMessages/PingMessage';
import { send } from 'common/Utils/NetworkUtils';
import DespawnClientPlayerAction from 'common/Actions/DespawnClientPlayerAction';
import PlayerLoggedOutMessage from 'common/NetworkMessages/PlayerLoggedOutMessage';
import AuthenticationRequestMessage from 'common/NetworkMessages/AuthenticationRequestMessage';
import BroadcastPlayersLatencyMessage from 'common/NetworkMessages/BroadcastPlayersLatencyMessage';
import InitializeGameMessage from 'common/NetworkMessages/InitializeGameMessage';
import PlayerLoggedInMessage from 'common/NetworkMessages/PlayerLoggedInMessage';
import AuthenticationResponseMessage from 'common/NetworkMessages/AuthenticationResponseMessage';
import { SERVER_SENDER_ID } from 'common/Constants';

import { broadcastToEveryone, broadcastToOthers } from '../Utils/ServerNetworkUtils';
import ClientsRegistry from '../Registries/ClientsRegistries';
import GameUpdateMessage from '../../common/NetworkMessages/GameUpdateMessage';

/**
 * @param {ActionController} actionController
 * @param {GameState} gameState
 * @param {GameSceneSnapshots} gameSceneSnapshots
 * @param {BroadcastedActionsQueue} broadcastedActionsQueue
 * @constructor
 */
function ServerNetworkMessageSystem(
  actionController,
  gameState,
  gameSceneSnapshots,
  broadcastedActionsQueue,
) {
  const messageProcessors = new Map([
    [AuthenticationRequestMessage, processAuthenticationRequestMessage],
    [PongMessage, processPongMessage],
  ]);

  const UNAUTHENTICATED_CONNECTION_TIMEOUT = 60000;
  const CONNECTION_TIMEOUT = 30000;
  const BROADCAST_LATENCY_INTERVAL = 5000;
  const PING_INTERVAL = 1000;

  /**
   * This map stores dates of last ping messages by players id.
   * It preserves last message date even if pong response has been received.
   * It does not contain a date for a player has just connected.
   *
   * @type {Map<number, Date>}
   */
  const lastPingMessageDates = new Map();

  /**
   * This map stores ping messages by Ping ID.
   * It preserves only those messages that have not been responded with a pong message.
   *
   * @type {Map<number, PingMessage>}
   */
  const pingMessagesById = new Map();

  /**
   * This map stores ping messages by Client ID.
   * It preserves only those messages that have not been responded with a pong message.
   *
   * @type {Map<number, PingMessage>}
   */
  const pingMessagesByClientId = new Map();

  /**
   * Stores a copy of broadcastedActionsQueue, so we can still send InitializeGameMessage to newly
   * connected players, after the original broadcastedActionsQueue gets emptied.
   *
   * @type {Array}
   */
  let preservedActionsQueue = [];

  let pingIdCounter = 0;

  // INTERFACES IMPLEMENTATION.
  this.updatableInterface = new UpdatableInterface(this, {
    /**
     * Send ping messages and close sockets that do not respond.
     */
    update: () => {
      broadcastGameUpdate();
      ping();
    },
  });

  this.systemInterface = new SystemInterface(this, {
    canProcess: message => messageProcessors.has(message.constructor),

    process: message => messageProcessors.get(message.constructor)(message),
  });

  // CLASS IMPLEMENTATION.
  setInterval(broadcastPlayersLatency, BROADCAST_LATENCY_INTERVAL);

  function broadcastGameUpdate() {
    const actions = broadcastedActionsQueue.getActions();
    broadcastedActionsQueue.clearActions();
    preservedActionsQueue = actions;

    gameState.previousServerTick = gameState.serverTick;
    gameState.serverTick = gameState.currentTick;
    const gameUpdateMessage = new GameUpdateMessage(
      actions,
      gameState.previousServerTick,
      gameState.serverTick,
    );
    broadcastToEveryone(gameUpdateMessage);

    gameState.lastServerUpdateTime = new Date();
  }

  function ping() {
    const now = new Date();
    for (const player of ActivePlayersRegistry.getAllPlayers()) {
      const ws = ClientsRegistry.getSocketByClientId(player.clientId);
      if (!ws) {
        throw new Error('Player in ActivePlayersRegistry has got no socket, was she despawned?');
      }
      if (ws.readyState === ws.CLOSED) {
        dropPlayer(player);
        continue;
      }

      const lastPingMessageDate = lastPingMessageDates.get(player.clientId);

      const hasNoPingMessageSent = !lastPingMessageDate;
      const isAwaitingPongMessage = pingMessagesByClientId.has(player.clientId);
      const isTimeToSendAnotherPing = !hasNoPingMessageSent
        && !isAwaitingPongMessage
        && now - lastPingMessageDate > PING_INTERVAL;

      const noPingTime = now - lastPingMessageDate;
      const timeout = noPingTime > CONNECTION_TIMEOUT
        || (!player.authenticated && noPingTime > UNAUTHENTICATED_CONNECTION_TIMEOUT);
      if (hasNoPingMessageSent || isTimeToSendAnotherPing) {
        sendPingMessage(now, player);
      } else if (timeout) {
        dropPlayer(player);
        log(`Connection with Player (${player.clientId}) has been dropped (timeout)`);
      }
    }
  }

  /**
   * @param {AuthenticationRequestMessage} message
   */
  function processAuthenticationRequestMessage(message) {
    const gameScene = gameSceneSnapshots.getCurrent();
    const clientId = message.networkMessageInterface.getSenderId();
    const player = ActivePlayersRegistry.getPlayerById(clientId);
    const displayName = (message.getDisplayName() || '').trim();

    const currentPlayerSocket = ClientsRegistry.getSocketByClientId(clientId);
    if (displayName && displayName.length >= 2 && displayName.length <= 20) {
      // Send OK authentication response to the client.
      send(currentPlayerSocket, new AuthenticationResponseMessage(clientId));

      // Send current Game State to the client.
      const activePlayers = wu(ActivePlayersRegistry.getAllPlayers())
        .filter(activePlayer => activePlayer.authenticated)
        .toArray();

      const playerObjects = {};
      for (const [playerClientId, playerObject] of gameScene.getAllPlayersWithClientIds()) {
        playerObjects[playerClientId] = playerObject;
      }

      const gameUpdateMessage = new InitializeGameMessage(
        activePlayers,
        playerObjects,
        gameScene.getAllBuildableObjects(),
        preservedActionsQueue,
        gameState.serverTick,
      );
      send(currentPlayerSocket, gameUpdateMessage);

      // Broadcast information to other clients.
      player.displayName = displayName;
      player.authenticated = true;
      broadcastToOthers(currentPlayerSocket, new PlayerLoggedInMessage(player));
    } else {
      send(currentPlayerSocket, new AuthenticationResponseMessage('Invalid display name'));
    }
  }

  /**
   * @param {PongMessage} message
   */
  function processPongMessage(message) {
    const now = new Date();
    const clientId = message.networkMessageInterface.getSenderId();
    const player = ActivePlayersRegistry.getPlayerById(clientId);
    if (!player) {
      log(`There is no active player with such id: ${clientId}`);
      return;
    }
    const lastPingMessageDate = lastPingMessageDates.get(clientId);
    if (!lastPingMessageDate) {
      log(`Ping message has never been sent to the player with such id: (${clientId}`);
      return;
    }

    player.latency = now - lastPingMessageDate;
    pingMessagesByClientId.delete(player.clientId);
    pingMessagesById.delete(message.getPingId());
  }

  /**
   * @param {Date} now
   * @param {PlayerModel} player
   * @return PingMessage
   */
  function sendPingMessage(now, player) {
    lastPingMessageDates.set(player.clientId, now);
    const pingMessage = new PingMessage(pingIdCounter, player.latency);
    pingMessagesById.set(pingMessage.getPingId(), pingMessage);
    pingMessagesByClientId.set(player.clientId, pingMessage);
    pingIdCounter += 1;

    const ws = ClientsRegistry.getSocketByClientId(player.clientId);
    send(ws, pingMessage);
  }

  /**
   * @param {PlayerModel} player
   */
  function dropPlayer(player) {
    // Firstly we emit close signal for ws (ServerNetworkController),
    // after that, on next network tick, we can clean up the player.
    const ws = ClientsRegistry.getSocketByClientId(player.clientId);
    if (ws.readyState === ws.OPEN) {
      ws.terminate();
      return;
    }

    const pingMessage = pingMessagesByClientId.get(player.clientId);
    if (pingMessage) {
      pingMessagesById.delete(pingMessage.getPingId());
      pingMessagesByClientId.delete(player.clientId);
    }

    ClientsRegistry.removeClientWithId(player.clientId);
    actionController.addAction(new DespawnClientPlayerAction(player.clientId, 0, SERVER_SENDER_ID));
    broadcastToOthers(ws, new PlayerLoggedOutMessage(player.clientId));
  }

  function broadcastPlayersLatency() {
    const playersLatency = {};
    for (const player of ActivePlayersRegistry.getAllPlayers()) {
      if (player.authenticated) {
        playersLatency[player.clientId] = player.latency;
      }
    }
    const broadcastPlayersLatencyMessage = new BroadcastPlayersLatencyMessage(playersLatency);
    broadcastToEveryone(broadcastPlayersLatencyMessage);
  }
}

export default ServerNetworkMessageSystem;
