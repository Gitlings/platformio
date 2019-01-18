/* eslint-disable import/prefer-default-export */

/**
 * @param action
 * @param {PlayerModel} player
 * @returns {boolean}
 */
export function replaying(action, player) {
  const { senderId } = action.actionInterface;
  return senderId !== null && senderId === player.clientId;
}
