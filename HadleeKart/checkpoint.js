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
    
    console.log('[CheckpointManager] ===== RACE START =====');
    console.log('[CheckpointManager] Total checkpoints:', this.checkpoints.length);
    console.log('[CheckpointManager] Checkpoint details:');
    this.checkpoints.forEach((cp, i) => {
      console.log(`  [${i}] index=${cp.index}, isFinishLine=${cp.isFinishLine}, name=${cp.name}`);
    });
    
    // Set initial respawn to Start0 position, NOT the checkpoint
    if (this.startPositions.length > 0) {
      const start0 = this.startPositions[0];
      this.lastRespawnPoint = start0.position.clone();
      this.lastRespawnRotation = start0.rotation;
      console.log('[CheckpointManager] Initial respawn set to Start0:', {
        x: start0.position.x.toFixed(2),
        y: start0.position.y.toFixed(2),
        z: start0.position.z.toFixed(2)
      });
    } else if (this.checkpoints.length > 0) {
      // Fallback to checkpoint if no start positions
      const finishLine = this.checkpoints[0];
      this.lastRespawnPoint = finishLine.position.clone();
      this.lastRespawnRotation = 0;
      console.warn('[CheckpointManager] No start positions, using checkpoint 0');
    }
    
    console.log('[CheckpointManager] ======================');
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
    
    // Check if already passed in this lap
    const alreadyPassed = this.checkpointsPassed.has(key);
    
    console.log(`[CheckpointManager] ===== CHECKPOINT TRIGGER =====`);
    console.log(`[CheckpointManager] Checkpoint index: ${checkpoint.index}`);
    console.log(`[CheckpointManager] Is finish line: ${checkpoint.isFinishLine}`);
    console.log(`[CheckpointManager] Already passed this lap: ${alreadyPassed}`);
    console.log(`[CheckpointManager] Current lap: ${this.currentLap}`);
    console.log(`[CheckpointManager] Checkpoints passed this lap: ${this.checkpointsPassed.size}/${this.checkpoints.length}`);
    console.log(`[CheckpointManager] Passed checkpoints Set:`, Array.from(this.checkpointsPassed));
    
    // Always update respawn point when crossing any checkpoint (even if already passed this lap)
    const oldRespawn = this.lastRespawnPoint ? 
      `(${this.lastRespawnPoint.x.toFixed(1)}, ${this.lastRespawnPoint.y.toFixed(1)}, ${this.lastRespawnPoint.z.toFixed(1)})` : 
      'none';
    this.lastRespawnPoint = checkpoint.position.clone();
    this.lastRespawnRotation = 0;
    console.log(`[CheckpointManager] Respawn point updated: ${oldRespawn} -> (${checkpoint.position.x.toFixed(1)}, ${checkpoint.position.y.toFixed(1)}, ${checkpoint.position.z.toFixed(1)})`);
    
    // IMPORTANT: Check finish line BEFORE the early return for already-passed checkpoints
    // This allows lap completion when crossing finish line multiple times
    if (checkpoint.isFinishLine && alreadyPassed) {
      console.log(`[CheckpointManager] Finish line crossed again (already passed). Checking for lap completion...`);
      this.handleFinishLine();
      console.log(`[CheckpointManager] =============================`);
      return;
    }
    
    // If already passed this lap and not finish line, don't count it again
    if (alreadyPassed) {
      console.log(`[CheckpointManager] Checkpoint already passed this lap, skipping count`);
      console.log(`[CheckpointManager] =============================`);
      return;
    }
    
    // Mark as passed for this lap
    this.checkpointsPassed.add(key);
    console.log(`[CheckpointManager] Added to passed set. New count: ${this.checkpointsPassed.size}/${this.checkpoints.length}`);
    
    // Callback
    if (this.onCheckpointPass) {
      this.onCheckpointPass(checkpoint, this.checkpointsPassed.size, this.checkpoints.length);
    }
    
    // Check if this is the finish line - handle lap completion
    if (checkpoint.isFinishLine) {
      console.log(`[CheckpointManager] This is the finish line! Calling handleFinishLine()...`);
      this.handleFinishLine();
    } else {
      console.log(`[CheckpointManager] Regular checkpoint, not finish line`);
    }
    console.log(`[CheckpointManager] =============================`);
  }

  /**
   * Handle passing through a dropoff point
   */
  passDropoff(dropoff) {
    const key = `dropoff_${dropoff.index}`;
    
    // Use a separate tracking to avoid spam
    if (!this._lastDropoff) this._lastDropoff = null;
    if (this._lastDropoff === key) return;
    
    this._lastDropoff = key;
    
    // Dropoff points update respawn location, don't count as checkpoints
    this.lastRespawnPoint = dropoff.position.clone();
    this.lastRespawnRotation = dropoff.rotation;
    
    console.log(`[CheckpointManager] Dropoff ${dropoff.index} passed - respawn point updated`);
  }

  /**
   * Handle crossing finish line
   */
  handleFinishLine() {
    console.log(`[CheckpointManager] ----- FINISH LINE HANDLER -----`);
    console.log(`[CheckpointManager] Current lap: ${this.currentLap}/${this.totalLaps}`);
    console.log(`[CheckpointManager] Checkpoints passed: ${this.checkpointsPassed.size}/${this.checkpoints.length}`);
    console.log(`[CheckpointManager] Passed set:`, Array.from(this.checkpointsPassed));
    
    // Check if all checkpoints were passed (including the finish line itself)
    const requiredCheckpoints = this.checkpoints.length;
    
    // On lap 1, we need all checkpoints including finish line
    // On subsequent laps, we also need all checkpoints
    if (this.checkpointsPassed.size < requiredCheckpoints) {
      console.log(`[CheckpointManager] ❌ Not enough checkpoints! Need ${requiredCheckpoints}, have ${this.checkpointsPassed.size}`);
      console.log(`[CheckpointManager] ----------------------------------`);
      return;
    }
    
    // All checkpoints passed! Complete the lap
    const lapTime = performance.now() - this.lapStartTime;
    this.lapTimes.push(lapTime);
    
    console.log(`[CheckpointManager] ✓✓✓ LAP ${this.currentLap} COMPLETE! Time: ${(lapTime / 1000).toFixed(2)}s ✓✓✓`);
    
    if (this.onLapComplete) {
      this.onLapComplete(this.currentLap, lapTime);
    }
    
    // Check if race is complete
    if (this.currentLap >= this.totalLaps) {
      console.log(`[CheckpointManager] 🏁 RACE COMPLETE! 🏁`);
      this.finishRace();
    } else {
      // Start next lap
      this.currentLap++;
      this.checkpointsPassed.clear();
      this.lapStartTime = performance.now();
      console.log(`[CheckpointManager] 🔄 Starting lap ${this.currentLap}, checkpoints cleared`);
    }
    console.log(`[CheckpointManager] ----------------------------------`);
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
    console.log(`[CheckpointManager] *** RESPAWN REQUEST ***`);
    console.log(`[CheckpointManager] Last respawn point:`, this.lastRespawnPoint);
    console.log(`[CheckpointManager] Last respawn rotation:`, this.lastRespawnRotation);
    
    if (!this.lastRespawnPoint) {
      // Default to origin if no checkpoint passed yet
      console.log(`[CheckpointManager] No respawn point set, using origin`);
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: 0
      };
    }
    
    const respawnPoint = {
      position: this.lastRespawnPoint.clone(),
      rotation: this.lastRespawnRotation
    };
    console.log(`[CheckpointManager] Returning respawn:`, {
      x: respawnPoint.position.x.toFixed(2),
      y: respawnPoint.position.y.toFixed(2),
      z: respawnPoint.position.z.toFixed(2),
      rotation: respawnPoint.rotation.toFixed(2)
    });
    console.log(`[CheckpointManager] ***********************`);
    
    return respawnPoint;
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
