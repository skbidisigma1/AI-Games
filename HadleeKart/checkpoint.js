/**
 * Checkpoint and Lap Management System
 */

export class CheckpointManager {
  constructor(checkpoints, dropoffPoints, startPositions, config = {}) {
    this.checkpoints = checkpoints || [];
    this.dropoffPoints = dropoffPoints || [];
    this.startPositions = startPositions || [];
    this.config = config;
    this.debugConfig = config.debug || {};
    
    // State
    this.currentLap = 1;
    this.totalLaps = config.race?.totalLaps || 3;
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
    
    if (this.debugConfig.logCheckpoints) {
      console.log('[CheckpointManager] ===== RACE START =====');
      console.log('[CheckpointManager] Total checkpoints:', this.checkpoints.length);
      console.log('[CheckpointManager] Checkpoint details:');
      this.checkpoints.forEach((cp, i) => {
        console.log(`  [${i}] index=${cp.index}, isFinishLine=${cp.isFinishLine}, name=${cp.name}`);
      });
    }
    
    // Set initial respawn to Start0 position, NOT the checkpoint
    if (this.startPositions.length > 0) {
      const start0 = this.startPositions[0];
      this.lastRespawnPoint = start0.position.clone();
      // Use calculated rotation facing next checkpoint instead of fixed rotation
      this.lastRespawnRotation = this.calculateOptimalRespawnRotation(start0.position);
      if (this.debugConfig.logCheckpoints) {
        console.log('[CheckpointManager] Initial respawn set to Start0:', {
          x: start0.position.x.toFixed(2),
          y: start0.position.y.toFixed(2),
          z: start0.position.z.toFixed(2),
          rotation: this.lastRespawnRotation.toFixed(2)
        });
      }
    } else if (this.checkpoints.length > 0) {
      // Fallback to checkpoint if no start positions
      const finishLine = this.checkpoints[0];
      this.lastRespawnPoint = finishLine.position.clone();
      this.lastRespawnRotation = this.calculateOptimalRespawnRotation(finishLine.position);
      console.warn('[CheckpointManager] No start positions, using checkpoint 0');
    }
    
    if (this.debugConfig.logCheckpoints) {
      console.log('[CheckpointManager] ======================');
    }
  }

  /**
   * Update checkpoint detection
   */
  update(kartPosition) {
    if (this.isRaceFinished) return;
    
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
    
    if (this.debugConfig.logCheckpoints) {
      console.log(`[CheckpointManager] ===== CHECKPOINT TRIGGER =====`);
      console.log(`[CheckpointManager] Checkpoint index: ${checkpoint.index}`);
      console.log(`[CheckpointManager] Is finish line: ${checkpoint.isFinishLine}`);
      console.log(`[CheckpointManager] Already passed this lap: ${alreadyPassed}`);
      console.log(`[CheckpointManager] Current lap: ${this.currentLap}`);
      console.log(`[CheckpointManager] Checkpoints passed this lap: ${this.checkpointsPassed.size}/${this.checkpoints.length}`);
    }
    
    // Always update respawn point when crossing any checkpoint (even if already passed this lap)
    this.lastRespawnPoint = checkpoint.position.clone();
    // Rotation will be calculated dynamically to face next checkpoint
    
    // IMPORTANT: Check finish line BEFORE the early return for already-passed checkpoints
    // This allows lap completion when crossing finish line multiple times
    if (checkpoint.isFinishLine && alreadyPassed) {
      if (this.debugConfig.logCheckpoints) {
        console.log(`[CheckpointManager] Finish line crossed again (already passed). Checking for lap completion...`);
      }
      this.handleFinishLine();
      if (this.debugConfig.logCheckpoints) {
        console.log(`[CheckpointManager] =============================`);
      }
      return;
    }
    
    // If already passed this lap and not finish line, don't count it again
    if (alreadyPassed) {
      if (this.debugConfig.logCheckpoints) {
        console.log(`[CheckpointManager] Checkpoint already passed this lap, skipping count`);
        console.log(`[CheckpointManager] =============================`);
      }
      return;
    }
    
    // Mark as passed for this lap
    this.checkpointsPassed.add(key);
    
    if (this.debugConfig.logCheckpoints) {
      console.log(`[CheckpointManager] Added to passed set. New count: ${this.checkpointsPassed.size}/${this.checkpoints.length}`);
    }
    
    // Callback
    if (this.onCheckpointPass) {
      this.onCheckpointPass(checkpoint, this.checkpointsPassed.size, this.checkpoints.length);
    }
    
    // Check if this is the finish line - handle lap completion
    if (checkpoint.isFinishLine) {
      if (this.debugConfig.logCheckpoints) {
        console.log(`[CheckpointManager] This is the finish line! Calling handleFinishLine()...`);
      }
      this.handleFinishLine();
    }
    
    if (this.debugConfig.logCheckpoints) {
      console.log(`[CheckpointManager] =============================`);
    }
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
    // Rotation will be calculated dynamically to face next checkpoint
    
    if (this.debugConfig.logCheckpoints) {
      console.log(`[CheckpointManager] Dropoff ${dropoff.index} passed - respawn point updated`);
    }
  }

  /**
   * Handle crossing finish line
   */
  handleFinishLine() {
    if (this.debugConfig.logLaps) {
      console.log(`[CheckpointManager] ----- FINISH LINE HANDLER -----`);
      console.log(`[CheckpointManager] Current lap: ${this.currentLap}/${this.totalLaps}`);
      console.log(`[CheckpointManager] Checkpoints passed: ${this.checkpointsPassed.size}/${this.checkpoints.length}`);
    }
    
    // Check if all checkpoints were passed (including the finish line itself)
    const requiredCheckpoints = this.checkpoints.length;
    
    // On lap 1, we need all checkpoints including finish line
    // On subsequent laps, we also need all checkpoints
    if (this.checkpointsPassed.size < requiredCheckpoints) {
      if (this.debugConfig.logLaps) {
        console.log(`[CheckpointManager] ❌ Not enough checkpoints! Need ${requiredCheckpoints}, have ${this.checkpointsPassed.size}`);
        console.log(`[CheckpointManager] ----------------------------------`);
      }
      return;
    }
    
    // All checkpoints passed! Complete the lap
    const lapTime = performance.now() - this.lapStartTime;
    this.lapTimes.push(lapTime);
    
    console.log(`✓ LAP ${this.currentLap} COMPLETE! Time: ${CheckpointManager.formatTime(lapTime)}`);
    
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
      if (this.debugConfig.logLaps) {
        console.log(`[CheckpointManager] 🔄 Starting lap ${this.currentLap}, checkpoints cleared`);
      }
    }
    
    if (this.debugConfig.logLaps) {
      console.log(`[CheckpointManager] ----------------------------------`);
    }
  }

  /**
   * Finish the race
   */
  finishRace() {
    this.isRaceFinished = true;
    const totalTime = performance.now() - this.raceStartTime;
    
    console.log('🏁 RACE COMPLETE! Total time:', CheckpointManager.formatTime(totalTime));
    console.log('Lap times:', this.lapTimes.map(t => CheckpointManager.formatTime(t)).join(', '));
    
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
    
    // Calculate optimal rotation to face the next checkpoint or dropoff
    const rotation = this.calculateOptimalRespawnRotation(this.lastRespawnPoint);
    
    return {
      position: this.lastRespawnPoint.clone(),
      rotation: rotation
    };
  }

  /**
   * Calculate rotation to face the nearest next checkpoint or dropoff from a position
   */
  calculateOptimalRespawnRotation(fromPosition) {
    // Find the next checkpoint we need to pass
    let targetPosition = null;
    
    // First, try to find the next uncompleted checkpoint
    for (let i = 0; i < this.checkpoints.length; i++) {
      const checkpoint = this.checkpoints[i];
      const key = `cp_${checkpoint.index}`;
      
      if (!this.checkpointsPassed.has(key)) {
        targetPosition = checkpoint.position;
        break;
      }
    }
    
    // If all checkpoints passed, aim for the finish line (checkpoint 0)
    if (!targetPosition && this.checkpoints.length > 0) {
      targetPosition = this.checkpoints[0].position;
    }
    
    // If still no target, try nearest dropoff point
    if (!targetPosition && this.dropoffPoints.length > 0) {
      let nearestDropoff = null;
      let nearestDistance = Infinity;
      
      for (const dropoff of this.dropoffPoints) {
        const dist = fromPosition.distanceTo(dropoff.position);
        if (dist < nearestDistance && dist > 0.1) { // Avoid the current dropoff
          nearestDistance = dist;
          nearestDropoff = dropoff;
        }
      }
      
      if (nearestDropoff) {
        targetPosition = nearestDropoff.position;
      }
    }
    
    // Calculate rotation angle to face the target
    if (targetPosition) {
      const dx = targetPosition.x - fromPosition.x;
      const dz = targetPosition.z - fromPosition.z;
      return Math.atan2(dx, dz);
    }
    
    // Fallback to stored rotation or 0
    return this.lastRespawnRotation || 0;
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
