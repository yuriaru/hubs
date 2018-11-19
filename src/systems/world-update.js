AFRAME.registerSystem("world-update", {
  init() {
    this._patchRenderFunc();
    this._patchThreeJS();
    this.frame = 0;
  },

  _patchThreeJS: function() {
    //const frame = this.frame;

    THREE.Object3D.prototype.updateMatrixWorld = function(force /*, frame*/) {
      if (!this.visible) return;

      if (this.matrixAutoUpdate || this.matrixNeedsUpdate) {
        this.updateMatrix();
        this.matrixNeedsUpdate = false;
      }

      if (this.matrixWorldNeedsUpdate || force) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        }

        this.matrixWorldNeedsUpdate = false;

        force = true;
      }

      // update children

      const children = this.children;

      for (let i = 0, l = children.length; i < l; i++) {
        children[i].updateMatrixWorld(force);
      }
    };
  },

  _patchRenderFunc: function() {
    const renderer = this.el.renderer;
    const render = renderer.render;
    const frame = this.frame;

    renderer.render = (scene, camera, renderTarget) => {
      scene.updateMatrixWorld(true, frame);
      render.call(renderer, scene, camera, renderTarget);
      this.frame++;
    };
  }
});
