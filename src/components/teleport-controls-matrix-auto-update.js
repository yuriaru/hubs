AFRAME.registerComponent("teleport-controls-matrix-auto-update", {
  tick: function() {
    const teleportControls = this.el.components["teleport-controls"];
    if (this.lastHitEntity !== teleportControls.hitEntity) {
      document.querySelectorAll(".hitEntity").forEach(o => (o.object3D.matrixAutoUpdate = true));
      this.lastHitEntity = teleportControls.hitEntity;
    }
  }
});
