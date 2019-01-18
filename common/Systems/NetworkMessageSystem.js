import EngineConfig from '../EngineConfig';
import BroadcastActionMessage from '../NetworkMessages/BroadcastActionMessage';
import SystemInterface from '../Interfaces/SystemInterface';

/**
 * @param {ActionController} actionController
 * @constructor
 */
function NetworkMessageSystem(actionController) {
  const messageProcessors = new Map([
    [BroadcastActionMessage, processActionMessage],
  ]);

  this.systemInterface = new SystemInterface(this, {
    canProcess: message => messageProcessors.has(message.constructor),

    process: message => messageProcessors.get(message.constructor)(message),
  });

  /**
   * @param {BroadcastActionMessage} message
   */
  function processActionMessage(message) {
    const action = message.networkMessageInterface.getPayload();
    const senderId = message.networkMessageInterface.getSenderId();
    if (EngineConfig.isServer()) {
      action.actionInterface.senderId = senderId;
    }
    actionController.addAction(action);
  }
}

export default NetworkMessageSystem;
