import ActionInterface from '../Interfaces/ActionInterface';
import SerializableInterface from '../Interfaces/SerializableInterface';
import { setDebugProperty } from '../Utils/Debug';

/**
 * @param {Player} player
 * @param {number} clientId
 * @param {number|null} tickOccurred
 * @param {number|null} senderId
 * @param {number|null} clientActionId
 * @constructor
 */
function SpawnPlayerAction(
  player,
  clientId,
  tickOccurred = null,
  senderId = null,
  clientActionId = null,
) {
  const parameters = {};

  // INTERFACES IMPLEMENTATION.
  this.actionInterface = new ActionInterface(this, {
    isBroadcastedAfterExecution: () => true,
  });

  // CLASS IMPLEMENTATION.
  this.getPlayer = () => player;
  setDebugProperty(this, 'player', player);

  this.getClientId = () => clientId;
  this.setClientId = (newClientId) => {
    parameters.clientId = newClientId;
    setDebugProperty(this, 'clientId', newClientId);
  };

  // INITIALIZE DEFAULT PARAMETERS.
  this.setClientId(clientId);
  this.actionInterface.tickOccurred = tickOccurred;
  this.actionInterface.senderId = senderId;
  this.actionInterface.clientActionId = clientActionId;
}

SpawnPlayerAction.serializableInterface =
  new SerializableInterface(SpawnPlayerAction, {
    /**
     * @param {SpawnPlayerAction} action
     */
    serialize: action => ({
      player: () => action.getPlayer(),
      clientId: () => action.getClientId(),
      tickOccurred: () => action.actionInterface.tickOccurred,
      senderId: () => action.actionInterface.senderId,
      clientActionId: () => action.actionInterface.clientActionId,
    }),

    deserialize: object => new SpawnPlayerAction(
      object.player,
      object.clientId,
      object.tickOccurred,
      object.senderId,
      object.clientActionId,
    ),
  });

export default SpawnPlayerAction;
