AFRAME.registerComponent("matrix-auto-update", {
  init: function() {
    this.el.object3D.matrixAutoUpdate = true;
  }
});
