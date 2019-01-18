/**
 * @param {GameState} gameState
 * @constructor
 */
function GameStateReadOnly(gameState) {
  this.getLagCompensatedTick = () => gameState.lagCompensatedTick;
  this.getCurrentTick = () => gameState.currentTick;
  /**
   * @type {number}
   */
  this.getServerTick = () => gameState.serverTick;
  /**
   * @type {number}
   */
  this.getPreviousServerTick = () => gameState.previousServerTick;
  /**
   * @type {Date}
   */
  this.getLastServerUpdateTime = () => gameState.lastServerUpdateTime;
}

export default GameStateReadOnly;
