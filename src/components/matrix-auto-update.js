AFRAME.registerComponent("matrix-auto-update", {
  init: function() {
    for (const obj of Object.values(this.el.object3DMap)) {
      obj.matrixAutoUpdate = true;
    }
  }
});
