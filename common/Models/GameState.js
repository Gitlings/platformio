/**
 * @constructor
 */
function GameState() {
  /**
   * @type {number}
   */
  this.lagCompensatedTick = 0;
  /**
   * @type {number}
   */
  this.currentTick = 0;
  /**
   * @type {number}
   */
  this.serverTick = 0;
  /**
   * @type {number}
   */
  this.previousServerTick = 0;
  /**
   * @type {Date}
   */
  this.lastServerUpdateTime = 0;
}

export default GameState;
