/**
 * Checkpoint and Lap Management System
 */

export class CheckpointManager {
  constructor(checkpoints, dropoffPoints, startPositions) {
    this.checkpoints = checkpoints || [];
    this.dropoffPoints = dropoffPoints || [];
    this.startPositions = startPositions || [];
    
    // State
    this.currentLap = 1;
    this.totalLaps = 3;
    this.checkpointsPassed = new Set();
    this.lastRespawnPoint = null; // Last checkpoint or dropoff passed
    this.lastRespawnRotation = 0;
    
    // Tracking
    this.lapTimes = [];
    this.raceStartTime = null;
    this.lapStartTime = null;
    this.isRaceFinished = false;
    
    // Callbacks
    this.onCheckpointPass = null;
    this.onLapComplete = null;
    this.onRaceComplete = null;
  }

  /**
   * Start the race timer
   */
  startRace() {
    this.raceStartTime = performance.now();
    this.lapStartTime = performance.now();
    this.currentLap = 1;
    this.checkpointsPassed.clear();
    this.lapTimes = [];
    this.isRaceFinished = false;
    
    // Set initial respawn to Start0 position, NOT the checkpoint
    if (this.startPositions.length > 0) {
      const start0 = this.startPositions[0];
      this.lastRespawnPoint = start0.position.clone();
      this.lastRespawnRotation = start0.rotation;
      console.log('[CheckpointManager] Initial respawn set to Start0:', start0.position);
    } else if (this.checkpoints.length > 0) {
      // Fallback to checkpoint if no start positions
      const finishLine = this.checkpoints[0];
      this.lastRespawnPoint = finishLine.position.clone();
      this.lastRespawnRotation = 0;
      console.warn('[CheckpointManager] No start positions, using checkpoint 0');
    }
    
    console.log('[CheckpointManager] Race started');
  }

  /**
   * Update checkpoint detection
   */
  update(kartPosition) {
    if (this.isRaceFinished) return;
    
    // Debug: Log kart position periodically
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    if (this._debugCounter % 60 === 0) {
      console.log('[CheckpointManager] Kart position:', {
        x: kartPosition.x.toFixed(2),
        y: kartPosition.y.toFixed(2),
        z: kartPosition.z.toFixed(2)
      });
      console.log('[CheckpointManager] Checking', this.checkpoints.length, 'checkpoints and', this.dropoffPoints.length, 'dropoffs');
    }
    
    // Check regular checkpoints
    this.checkpoints.forEach((checkpoint) => {
      if (checkpoint.box.containsPoint(kartPosition)) {
        this.passCheckpoint(checkpoint, kartPosition);
      }
    });
    
    // Check dropoff points (respawn markers)
    this.dropoffPoints.forEach((dropoff) => {
      if (dropoff.box.containsPoint(kartPosition)) {
        this.passDropoff(dropoff);
      }
    });
  }

  /**
   * Handle passing through a checkpoint
   */
  passCheckpoint(checkpoint, kartPosition) {
    const key = `cp_${checkpoint.index}`;
    
    // Avoid triggering same checkpoint repeatedly
    if (this.checkpointsPassed.has(key)) return;
    
    this.checkpointsPassed.add(key);
    
    // Update respawn point
    this.lastRespawnPoint = checkpoint.position.clone();
    this.lastRespawnRotation = 0;
    
    // Check if this is the finish line
    if (checkpoint.isFinishLine) {
      this.handleFinishLine();
    }
    
    // Callback
    if (this.onCheckpointPass) {
      this.onCheckpointPass(checkpoint, this.checkpointsPassed.size, this.checkpoints.length);
    }
    
    console.log(`[CheckpointManager] Passed checkpoint ${checkpoint.index} (${this.checkpointsPassed.size}/${this.checkpoints.length})`);
  }

  /**
   * Handle passing through a dropoff point
   */
  passDropoff(dropoff) {
    // Dropoff points only update respawn location, don't count as checkpoints
    this.lastRespawnPoint = dropoff.position.clone();
    this.lastRespawnRotation = dropoff.rotation;
  }

  /**
   * Handle crossing finish line
   */
  handleFinishLine() {
    // First crossing doesn't count
    if (this.checkpointsPassed.size === 1 && this.currentLap === 1) {
      return;
    }
    
    // Check if all checkpoints were passed
    const requiredCheckpoints = this.checkpoints.length;
    if (this.checkpointsPassed.size < requiredCheckpoints) {
      console.log('[CheckpointManager] Finish line crossed but not all checkpoints passed');
      return;
    }
    
    // Complete lap
    const lapTime = performance.now() - this.lapStartTime;
    this.lapTimes.push(lapTime);
    
    console.log(`[CheckpointManager] Lap ${this.currentLap} complete! Time: ${(lapTime / 1000).toFixed(2)}s`);
    
    if (this.onLapComplete) {
      this.onLapComplete(this.currentLap, lapTime);
    }
    
    // Check if race is complete
    if (this.currentLap >= this.totalLaps) {
      this.finishRace();
    } else {
      // Start next lap
      this.currentLap++;
      this.checkpointsPassed.clear();
      this.lapStartTime = performance.now();
    }
  }

  /**
   * Finish the race
   */
  finishRace() {
    this.isRaceFinished = true;
    const totalTime = performance.now() - this.raceStartTime;
    
    console.log('[CheckpointManager] Race complete!', {
      totalTime: (totalTime / 1000).toFixed(2) + 's',
      lapTimes: this.lapTimes.map(t => (t / 1000).toFixed(2) + 's')
    });
    
    if (this.onRaceComplete) {
      this.onRaceComplete(totalTime, this.lapTimes);
    }
  }

  /**
   * Get respawn position and rotation
   */
  getRespawnPoint() {
    if (!this.lastRespawnPoint) {
      // Default to origin if no checkpoint passed yet
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: 0
      };
    }
    
    return {
      position: this.lastRespawnPoint.clone(),
      rotation: this.lastRespawnRotation
    };
  }

  /**
   * Get current race status
   */
  getStatus() {
    return {
      currentLap: this.currentLap,
      totalLaps: this.totalLaps,
      checkpointsPassed: this.checkpointsPassed.size,
      totalCheckpoints: this.checkpoints.length,
      isFinished: this.isRaceFinished,
      lapTimes: this.lapTimes
    };
  }

  /**
   * Format time in MM:SS.mmm
   */
  static formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor(milliseconds % 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}

export default CheckpointManager;
