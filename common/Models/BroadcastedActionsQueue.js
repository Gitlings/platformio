/**
 * @constructor
 */
function BroadcastedActionsQueue() {
  const queue = [];

  this.addAction = (action) => {
    action.actionInterface.hasBeenBroadcasted = true;
    queue.push(action);
  };

  this.clearActions = () => {
    queue.length = 0;
  };

  /**
   * @returns {*[]}
   */
  this.getActions = () => Array.from(queue);
}

export default BroadcastedActionsQueue;
