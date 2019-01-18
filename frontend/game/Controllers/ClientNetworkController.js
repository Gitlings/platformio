import UpdatableInterface from 'common/Interfaces/UpdatableInterface';
import NetworkControllerInterface from 'common/Interfaces/NetworkControllerInterface';
import NetworkMessageSystem from 'common/Systems/NetworkMessageSystem';
import BroadcastActionMessage from 'common/NetworkMessages/BroadcastActionMessage';
import { log } from 'common/Utils/Debug';
import PsonSerializationHelper from 'common/Utils/PsonSerializationHelper';

/**
 * @param {ClientNetworkMessageSystem} clientNetworkMessageSystem
 * @param {ActionController} actionController
 * @constructor
 */
function ClientNetworkController(clientNetworkMessageSystem, actionController) {
  const ws = new WebSocket(process.env.WEBSOCKET_ADDRESS);
  ws.binaryType = 'arraybuffer';
  clientNetworkMessageSystem.setWebSocket(ws);

  const networkMessageSystem = new NetworkMessageSystem(actionController);
  const messageQueue = [];

  this.updatableInterface = new UpdatableInterface(this, {
    update: () => {},
  });

  this.networkControllerInterface = new NetworkControllerInterface(this, {
    broadcastAction: (action) => {
      if (action.actionInterface.senderId === null) {
        this.send(new BroadcastActionMessage(action));
      }
    },
  });

  this.send = (message) => {
    const serializedMessage = PsonSerializationHelper.serialize(message);
    if (ws.readyState === ws.OPEN) {
      ws.send(serializedMessage);
    } else {
      messageQueue.push(serializedMessage);
    }
  };

  ws.addEventListener('open', () => {
    log('Connected to the server.');
    const messages = messageQueue.splice(0, messageQueue.length);
    messages.reverse();
    for (const message of messages) {
      ws.send(message);
    }
  });

  ws.addEventListener('message', (event) => {
    try {
      const message = PsonSerializationHelper.deserialize(event.data);
      if (clientNetworkMessageSystem.systemInterface.canProcess(message)) {
        clientNetworkMessageSystem.systemInterface.process(message);
      } else if (networkMessageSystem.systemInterface.canProcess(message)) {
        networkMessageSystem.systemInterface.process(message);
      }
    } catch (e) {
      log(`Not processable message: ${e.message}`);
      throw e;
    }
  });
}

export default ClientNetworkController;
