import SerializableInterface from '../Interfaces/SerializableInterface';

/**
 * @param {Iterable<*>} actions
 * @param {number} previousServerTick
 * @param {number} serverTick
 * @constructor
 */
function GameUpdateMessage(actions, previousServerTick, serverTick) {
  this.getActions = () => actions;

  this.getPreviousServerTick = () => previousServerTick;

  this.getServerTick = () => serverTick;
}

GameUpdateMessage.serializableInterface = new SerializableInterface(GameUpdateMessage, {
  /**
   * @param {GameUpdateMessage} message
   */
  serialize: message => ({
    actions: () => message.getActions(),
    previousServerTick: () => message.getPreviousServerTick(),
    serverTick: () => message.getServerTick(),
  }),

  deserialize: object => new GameUpdateMessage(
    object.actions,
    object.previousServerTick,
    object.serverTick,
  ),
});

export default GameUpdateMessage;
