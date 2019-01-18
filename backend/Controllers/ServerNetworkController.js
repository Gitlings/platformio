import WebSocket from 'ws';

import NetworkControllerInterface from 'common/Interfaces/NetworkControllerInterface';
import BroadcastActionMessage from 'common/NetworkMessages/BroadcastActionMessage';
import NetworkMessageSystem from 'common/Systems/NetworkMessageSystem';
import { log } from 'common/Utils/Debug';
import PlayerModel from 'common/Models/PlayerModel';
import UpdatableInterface from 'common/Interfaces/UpdatableInterface';
import { assertInterface } from 'common/Utils/InterfaceImplementation';
import NetworkMessageInterface from 'common/Interfaces/NetworkMessageInterface';
import PsonSerializationHelper from 'common/Utils/PsonSerializationHelper';

import ServerNetworkMessageSystem from '../Systems/ServerNetworkMessageSystem';
import ClientsRegistry from '../Registries/ClientsRegistries';
import { broadcastToEveryone } from '../Utils/ServerNetworkUtils';

/**
 * @param {ActionController} actionController
 * @param {GameState} gameState
 * @param {GameSceneSnapshots} gameSceneSnapshots
 * @param {BroadcastedActionsQueue} broadcastedActionsQueue
 * @constructor
 */
function ServerNetworkController(
  actionController,
  gameState,
  gameSceneSnapshots,
  broadcastedActionsQueue,
) {
  let clientIdCount = 0;

  const wss = new WebSocket.Server({
    port: 8080,
    perMessageDeflate: false,
  });
  const serverNetworkMessageSystem = new ServerNetworkMessageSystem(
    actionController,
    gameState,
    gameSceneSnapshots,
    broadcastedActionsQueue,
  );
  const networkMessageSystem = new NetworkMessageSystem(actionController);

  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {
      serverNetworkMessageSystem.updatableInterface.update();
    },
  });

  this.networkControllerInterface = new NetworkControllerInterface(this, {
    broadcastAction: (action) => {
      broadcastToEveryone(new BroadcastActionMessage(action));
    },
  });

  wss.on('connection', (ws, req) => {
    log(`A new player has connected: (${req.connection.remoteAddress})`);

    ws.on('message', (data) => {
      try {
        const message = PsonSerializationHelper.deserialize(data);

        const senderId = ClientsRegistry.getPlayerBySocket(ws).clientId;
        assertInterface(message.networkMessageInterface, NetworkMessageInterface);
        message.networkMessageInterface.setSenderId(senderId);

        if (serverNetworkMessageSystem.systemInterface.canProcess(message)) {
          serverNetworkMessageSystem.systemInterface.process(message);
        } else if (networkMessageSystem.systemInterface.canProcess(message)) {
          networkMessageSystem.systemInterface.process(message);
        }
      } catch (e) {
        log(`Not processable message: ${e.message}`);
        throw e;
      }
    });

    ws.on('close', (closeCode, closeMessage) => {
      const reason = closeMessage ? `: ${closeMessage}` : '';
      const { clientId } = ClientsRegistry.getPlayerBySocket(ws);
      log(`Connection with Player (${clientId}) has been closed (code ${closeCode})${reason}`);
    });

    const player = new PlayerModel(clientIdCount);
    ClientsRegistry.registerClient(player, ws);
    clientIdCount += 1;
  });

  process.on('SIGTERM', () => {
    log('Closing WebSocket...');

    wss.on('close', () => {
      log('Closed... Exit');
      process.exit();
    });
    wss.close();
  });
}

export default ServerNetworkController;
