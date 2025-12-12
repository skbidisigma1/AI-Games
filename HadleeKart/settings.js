export const HADLEE_KART_CONFIG = {
  debug: {
    logInfo: true,           // General info (model loading, spawning)
    logCheckpoints: false,    // Checkpoint pass events
    logLaps: true,           // Lap completion events (important)
    logRespawn: false,        // Respawn events
    logCollisions: false,     // Wall collision details
    logItems: false,          // Item collection/usage
    visualizeCheckpoints: false, // Show checkpoint boxes in 3D
    visualizeDropoffs: false,    // Show dropoff boxes in 3D
    logTrackLoading: true    // Track parsing details
  },
  
  renderer: {
    maxPixelRatio: 2
  },
  
  camera: {
    fov: 60,
    near: 0.1,
    far: 2500,
    followDistance: 8.5,
    followHeight: 3.6,
    lookAhead: 7,
    lookHeight: 1.6,
    smoothing: 0.001,
    rearView: {
      followDistance: 8,
      followHeight: 4,
      lookBack: 12,
      lookHeight: 1.8,
      fovOffset: 5,
      speedDistanceGain: 6
    }
  },
  
  lighting: {
    ambientSky: 0xcfd9ff,
    ambientGround: 0x060608,
    ambientIntensity: 0.6,
    sunColor: 0xffffff,
    sunIntensity: 0.85,
    sunPosition: { x: 25, y: 45, z: 12 },
    shadowMapSize: 1024
  },
  
  track: {
    path: './assets/track/spungilious_speedway/Spungilious Speedway.glb',
    bakePath: './assets/track/spungilious_speedway/bake/bake.png',
    width: 26,
    length: 1000,
    guardrailInset: 0.8,
    surface: {
      color: 0x1f2933,
      roughness: 0.78,
      metalness: 0.08
    },
    centerLine: {
      width: 0.4,
      color: 0xf9d342
    },
    guardrail: {
      color: 0x35435a,
      roughness: 0.45,
      height: 2.3,
      thickness: 0.5
    }
  },
  
  sky: {
    radius: 1600,
    color: 0x0c0f16,
    hdrPath: './assets/track/spungilious_speedway/sky/sky.hdr',
    useAsEnvironment: true, // Disable IBL to let baked lighting shine
    environmentIntensity: 0.3 // If enabled, keep it subtle
  },
  
  itemBox: {
    respawnTime: 1, // Seconds before item box reappears
    collectionRadius: 2.5, // Distance at which kart collects item
    size: 1.5, // Item box cube size
    rotationSpeed: 2, // rad/s
    bobHeight: 0.3, // Vertical bob distance
    bobSpeed: 3, // Frequency in Hz
    color: 0xffdd00,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3
  },
  
  vehicle: {
    body: {
      size: { x: 1.8, y: 0.9, z: 3.2 },
      color: 0xff5733
    },
    cockpit: {
      size: { x: 1.2, y: 0.6, z: 1.6 },
      offset: { x: 0, y: 0.4, z: -0.2 },
      color: 0x1e2333
    },
    spawnZOffset: 60,
    physics: {
      maxSpeed: 100,
      reverseSpeedFactor: 0.75,
      accelerationRate: 50,
      reverseAccelerationFactor: 0.7,
      brakeStrength: 40,
      dualInputForwardFactor: 0.3,
      dragCoefficient: 1.9,
      naturalDeceleration: 4,
      airDeceleration: 0.025, // 2.5% speed loss per second when airborne
      lateralRetention: {
        normal: 0.18,
        lowTraction: 0.48,
        drift: 0.62
      },
      turnRate: Math.PI * 0.35,
      lowSpeedTurnBoost: 1,
      dualInputTurnMultiplier: 0.65,
      driftTurnMultiplier: 1.2,
      reverseTurnMultiplier: 1.1,
      hopVelocity: 5,
      gravity: 26,
      groundSnapGravity: 55,
      jumpDamping: 20,
      maxSnapDistance: 2.0, // Max distance to snap to ground
      falloffThreshold: -10, // Y position that triggers respawn
      falloffGracePeriod: 0.5, // Seconds below threshold before respawn
      respawnCheckpointCooldown: 1.0, // Seconds after respawn before checkpoint detection
      wallImpact: {
        restitution: 0.25,
        tangentRetention: 0.85,
        minSpeedLoss: 0.1,
        maxSpeedLoss: 0.5,
        driftCancelDot: 0.65,
        severeDot: 0.85
      }
    }
  },
  
  drift: {
    minSpeed: 15,
    minSpeedRatio: 0.5,
    cancelSpeed: 5,
    lateralForce: 35,
    yawOffset: 0.32,
    maxLean: 0.22,
    yawSmoothing: 0.001,
    leanSmoothing: 0.0008,
    turnMultipliers: {
      tight: 1,
      neutral: 0.6,
      shallow: 0.2
    },
    chargeRates: {
      tight: 1.2,
      neutral: 0.5,
      shallow: 0.5
    },
    brakeCancelTime: 1,
    stages: [
      { name: 'Blue', time: 0.4, color: '#72b6ff', boostStrength: 220, duration: 0.3 },
      { name: 'Orange', time: 1.2, color: '#ffa646', boostStrength: 220, duration: 1 },
      { name: 'Rainbow', time: 2, color: '#ff5fe2', boostStrength: 220, duration: 2.5 }
    ]
  },
  
  race: {
    totalLaps: 3,
    checkpointCooldown: 0.2
  },
  
  trick: {
    upwardImpulse: 8,
    boostStrengthRatio: 0.45,
    boostDuration: 0.5,
    cooldown: 0.2
  },
  
  particles: {
    maxPoolSize: 2000,
    physics: {
      groundOffset: 0.02,
      bounce: 0.32,
      friction: 0.7
    },
    drift: {
      pre: { rate: 20, size: [0.08, 0.12], life: [0.25, 0.4], alpha: 0.4, colors: ['#72b6ff'] },
      blue: { rate: 32, size: [0.1, 0.16], life: [0.3, 0.45], alpha: 0.55, colors: ['#72b6ff'] },
      orange: { rate: 45, size: [0.12, 0.18], life: [0.35, 0.5], alpha: 0.65, colors: ['#ffa646'] },
      rainbow: { rate: 60, size: [0.14, 0.22], life: [0.4, 0.6], alpha: 0.8, colors: ['#ff5fe2', '#72b6ff', '#ffd166'] }
    },
    boost: {
      rate: 70,
      size: [0.14, 0.24],
      life: [0.25, 0.45],
      alpha: 0.85,
      color: '#ff8b3d'
    },
    landing: {
      count: 18,
      size: [0.1, 0.18],
      life: [0.25, 0.45],
      alpha: 0.45
    },
    items: {
      count: 24,
      color: 0xfff06a,
      colorJitter: 0xffffff,
      size: [0.12, 0.24],
      life: [0.35, 0.7],
      alpha: 0.85
    }
  }
};

export default HADLEE_KART_CONFIG;
