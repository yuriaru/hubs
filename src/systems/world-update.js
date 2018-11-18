const updateMatrices = function(frame, obj) {
  obj.updateMatrix();

  if (obj.parent === null) {
    obj.matrixWorld.copy(obj.matrix);
  } /* Check last frame */ else {
    obj.matrixWorld.multiplyMatrices(obj.parent.matrixWorld, obj.matrix);
  }

  const children = obj.children;
  for (let i = 0, l = children.length; i < l; i++) {
    updateMatrices(frame, children[i]);
  }
};

const ensureWorldMatrixUpdatedForFrame = function(frame, force, obj) {
  if (obj.lastWorldMatrixUpdateFrame === frame && !force) return;

  if (obj.parent !== null) {
    ensureWorldMatrixUpdatedForFrame(frame, force, obj.parent);
    obj.matrixWorld.multiplyMatrices(obj.parent.matrixWorld, obj.matrix);
  } else {
    obj.matrixWorld.copy(obj.matrix);
  }

  obj.lastWorldMatrixUpdateFrame = frame;
};

AFRAME.registerSystem("world-update", {
  init() {
    this._patchRenderFunc();
    this._patchThreeJS();
    this.frame = 0;
  },

  _patchThreeJS: function() {
    const frame = this.frame;

    THREE.Object3D.prototype.updateMatrixWorld = function(force) {
      ensureWorldMatrixUpdatedForFrame(frame, force, this);
    };
  },

  _patchRenderFunc: function() {
    const renderer = this.el.renderer;
    const render = renderer.render;
    const frame = this.frame;

    renderer.render = (scene, camera, renderTarget) => {
      updateMatrices(frame, scene);
      render.call(renderer, scene, camera, renderTarget);
      this.frame++;
    };
  }
});
