import GameSceneReadOnly from './GameSceneReadOnly';
import { copy } from '../Utils/CopyableHelpers';

/**
 * @constructor
 */
function GameSceneSnapshots() {
  let currentGameScene = null;
  let currentGameSceneReadOnly = null;
  const snapshots = new Map();

  /**
   * @return {GameScene}
   */
  this.getCurrent = () => currentGameScene;

  /**
   * @return {GameSceneReadOnly}
   */
  this.getCurrentReadOnly = () => currentGameSceneReadOnly;

  /**
   * @param {GameScene} newGameScene
   */
  this.setCurrent = (newGameScene) => {
    currentGameScene = newGameScene;
    currentGameSceneReadOnly = new GameSceneReadOnly(currentGameScene);
  };

  /**
   * @param {number} tick
   * @param {GameScene} gameScene
   */
  this.addSnapshot = (tick, gameScene) => {
    const existingSnapshot = snapshots.get(tick);
    if (existingSnapshot) {
      existingSnapshot.destroy();
      snapshots.delete(tick);
    }
    snapshots.set(tick, copy(gameScene));
  };

  this.getSnapshot = tick => snapshots.get(tick);

  this.removeSnapshotsOlder = (tick) => {
    for (const [snapshotTick, scene] of snapshots.entries()) {
      if (snapshotTick < tick) {
        scene.destroy();
        snapshots.delete(snapshotTick);
      }
    }
  };
}

export default GameSceneSnapshots;
