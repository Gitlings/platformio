import ActionInterface from '../Interfaces/ActionInterface';
import SerializableInterface from '../Interfaces/SerializableInterface';
import { setDebugProperty } from '../Utils/Debug';

/**
 * @param {string} playerHashId
 * @param {number|null} tickOccurred
 * @param {number|null} senderId
 * @param {number|null} clientActionId
 * @constructor
 */
function DespawnPlayerAction(
  playerHashId,
  tickOccurred = null,
  senderId = null,
  clientActionId = null,
) {
  // INTERFACES IMPLEMENTATION.
  this.actionInterface = new ActionInterface(this, {
    isBroadcastedAfterExecution: () => true,
  });

  // CLASS IMPLEMENTATION.
  this.getPlayerHashId = () => playerHashId;
  setDebugProperty(this, 'playerHashId', playerHashId);

  // INITIALIZE DEFAULT PARAMETERS.
  this.actionInterface.tickOccurred = tickOccurred;
  this.actionInterface.senderId = senderId;
  this.actionInterface.clientActionId = clientActionId;
}

DespawnPlayerAction.serializableInterface =
  new SerializableInterface(DespawnPlayerAction, {
    /**
     * @param {DespawnPlayerAction} action
     */
    serialize: action => ({
      playerHashId: () => action.getPlayerHashId(),
      tickOccurred: () => action.actionInterface.tickOccurred,
      senderId: () => action.actionInterface.senderId,
      clientActionId: () => action.actionInterface.clientActionId,
    }),

    deserialize: object => new DespawnPlayerAction(
      object.playerHashId,
      object.tickOccurred,
      object.senderId,
      object.clientActionId,
    ),
  });

export default DespawnPlayerAction;
