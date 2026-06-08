import { mat3 } from 'gl-matrix';

export interface PhysicsState {
  posX: number;
  posY: number;
  velX: number;
  velY: number;
  initialized: boolean;
}

export class MorphaPhysics {
  private states: Map<string, PhysicsState> = new Map();
  private windTime = 0;

  public reset() {
    this.states.clear();
    this.windTime = 0;
  }

  /**
   * Run physics simulation step for all bones in the list.
   * @param bones The array of bones to simulate and update.
   * @param dt Elapsed time in seconds.
   */
  public update(bones: any[], dt: number) {
    if (dt <= 0) return;
    // Cap dt to avoid instabilities under heavy frames
    if (dt > 0.05) dt = 0.05;

    this.windTime += dt;

    // Helper to calculate world matrix recursively for target pose
    const targetWorldMatrices = new Map<string, mat3>();
    const computeTargetWorldMatrix = (boneId: string): mat3 => {
      if (targetWorldMatrices.has(boneId)) return targetWorldMatrices.get(boneId)!;

      const bone = bones.find(b => b.id === boneId);
      if (!bone) {
        const identity = mat3.create();
        targetWorldMatrices.set(boneId, identity);
        return identity;
      }

      const boneMat = mat3.create();
      mat3.translate(boneMat, boneMat, bone.position);
      mat3.rotate(boneMat, boneMat, bone.rotation);

      if (bone.parentId) {
        const parentMat = computeTargetWorldMatrix(bone.parentId);
        mat3.multiply(boneMat, parentMat, boneMat);
      }

      targetWorldMatrices.set(boneId, boneMat);
      return boneMat;
    };

    // Keep simulated world matrices for parent reference
    const simWorldMatrices = new Map<string, mat3>();
    const computeSimWorldMatrix = (boneId: string): mat3 => {
      if (simWorldMatrices.has(boneId)) return simWorldMatrices.get(boneId)!;

      const bone = bones.find(b => b.id === boneId);
      if (!bone) {
        const identity = mat3.create();
        simWorldMatrices.set(boneId, identity);
        return identity;
      }

      // If physics is enabled, we already computed and stored the simulated world matrix.
      // If not, it falls back to the target world matrix.
      return computeTargetWorldMatrix(boneId);
    };

    // Resolve topological order to simulate parent states before child states.
    const resolved = new Set<string>();
    const simulateBone = (bone: any) => {
      if (resolved.has(bone.id)) return;
      if (bone.parentId) {
        const parent = bones.find(b => b.id === bone.parentId);
        if (parent) {
          simulateBone(parent);
        }
      }

      // Parent world matrix (using simulated matrices if parent is simulated)
      let parentMat = mat3.create();
      let parentWorldAngle = 0;
      if (bone.parentId) {
        parentMat = computeSimWorldMatrix(bone.parentId);
        // Extract rotation angle from parent world matrix
        parentWorldAngle = Math.atan2(parentMat[1], parentMat[0]);
      }

      // Compute joint position in world space (J = parentMat * [0, 0, 1]^T)
      const jointX = parentMat[6];
      const jointY = parentMat[7];

      // Target world angle
      const targetWorldAngle = parentWorldAngle + bone.rotation;

      // Target tip position in world space
      const targetTipX = jointX + bone.length * Math.cos(targetWorldAngle);
      const targetTipY = jointY + bone.length * Math.sin(targetWorldAngle);

      if (bone.physics && bone.physics.enabled) {
        let state = this.states.get(bone.id);
        if (!state || !state.initialized) {
          state = {
            posX: targetTipX,
            posY: targetTipY,
            velX: 0,
            velY: 0,
            initialized: true,
          };
          this.states.set(bone.id, state);
        }

        const mass = Math.max(0.01, bone.physics.mass || 1.0);
        const damping = Math.max(0, Math.min(1, bone.physics.damping ?? 0.1));
        const stiffness = Math.max(0, bone.physics.stiffness ?? 0.1);
        const gravity = bone.physics.gravity ?? 0.0;
        const wind = bone.physics.wind ?? 0.0;

        // Forces
        // Spring force pulling simulated tip to target tip
        const fSpringX = -stiffness * 300 * (state.posX - targetTipX);
        const fSpringY = -stiffness * 300 * (state.posY - targetTipY);

        // Gravity (pointing downwards along Y axis)
        const fGravityY = -gravity * 980 * mass;

        // Wind / noise force (time varying horizontal force)
        const windForceX = wind * Math.sin(this.windTime * 3.0 + jointX * 0.01) * 300 * mass;

        // Acceleration
        const accX = (fSpringX + windForceX) / mass;
        const accY = (fSpringY + fGravityY) / mass;

        // Update velocity
        state.velX = state.velX * (1 - damping) + accX * dt;
        state.velY = state.velY * (1 - damping) + accY * dt;

        // Update position
        state.posX += state.velX * dt;
        state.posY += state.velY * dt;

        // Constrain distance from joint to be exactly bone.length
        const dx = state.posX - jointX;
        const dy = state.posY - jointY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let simWorldAngle = targetWorldAngle;
        if (dist > 0.0001) {
          state.posX = jointX + bone.length * (dx / dist);
          state.posY = jointY + bone.length * (dy / dist);
          simWorldAngle = Math.atan2(dy, dx);
        } else {
          state.posX = jointX + bone.length * Math.cos(targetWorldAngle);
          state.posY = jointY + bone.length * Math.sin(targetWorldAngle);
        }

        // Project velocity onto tangent to keep constraints stable
        const bx = Math.cos(simWorldAngle);
        const by = Math.sin(simWorldAngle);
        const tx = -by;
        const ty = bx;
        const dot = state.velX * tx + state.velY * ty;
        state.velX = dot * tx;
        state.velY = dot * ty;

        // Calculate simulated relative rotation
        const simLocalRotation = simWorldAngle - parentWorldAngle;
        bone.rotation = simLocalRotation;

        // Compute simulated world matrix for this bone and store it
        const simMat = mat3.create();
        simMat[0] = Math.cos(simWorldAngle);
        simMat[1] = Math.sin(simWorldAngle);
        simMat[3] = -Math.sin(simWorldAngle);
        simMat[4] = Math.cos(simWorldAngle);
        simMat[6] = jointX;
        simMat[7] = jointY;
        simWorldMatrices.set(bone.id, simMat);
      } else {
        // Physics not enabled, use target world matrix
        simWorldMatrices.set(bone.id, computeTargetWorldMatrix(bone.id));
      }

      resolved.add(bone.id);
    };

    for (const bone of bones) {
      simulateBone(bone);
    }
  }
}
