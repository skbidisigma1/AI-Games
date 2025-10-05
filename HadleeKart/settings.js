export const HADLEE_KART_CONFIG = {
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
    smoothing: 0.001
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
    color: 0x0c0f16
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
  }
};

export default HADLEE_KART_CONFIG;
