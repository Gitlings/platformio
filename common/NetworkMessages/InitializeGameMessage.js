import SerializableInterface from '../Interfaces/SerializableInterface';

/**
 * @param {Iterable<PlayerModel>} activePlayers
 * @param {Object} playerObjects - Key is Client ID, value is Player.
 * @param {Iterable<*>} buildableObjects
 * @param {Iterable<*>} actions
 * @param {number} serverTick
 * @constructor
 */
function InitializeGameMessage(
  activePlayers,
  playerObjects,
  buildableObjects,
  actions,
  serverTick,
) {
  this.getActivePlayers = () => activePlayers;

  this.getPlayerObjects = () => playerObjects;

  this.getBuildableObjects = () => buildableObjects;

  this.getActions = () => actions;

  this.getServerTick = () => serverTick;
}

InitializeGameMessage.serializableInterface = new SerializableInterface(InitializeGameMessage, {
  /**
   * @param {InitializeGameMessage} message
   */
  serialize: message => ({
    activePlayers: () => message.getActivePlayers(),
    playerObjects: () => message.getPlayerObjects(),
    buildableObjects: () => message.getBuildableObjects(),
    actions: () => message.getActions(),
    serverTick: () => message.getServerTick(),
  }),

  deserialize: object => new InitializeGameMessage(
    object.activePlayers,
    object.playerObjects,
    object.buildableObjects,
    object.actions,
    object.serverTick,
  ),
});

export default InitializeGameMessage;
