const zeroPos = new THREE.Vector3(0, 0, 0);
const zeroQuat = new THREE.Quaternion();
const oneScale = new THREE.Vector3(1, 1, 1);
const identity = new THREE.Matrix4();
identity.identity();

AFRAME.registerSystem("world-update", {
  init() {
    this._patchRenderFunc();
    this._patchThreeJS();
    this.frame = 0;
  },

  _patchThreeJS: function() {
    //const frame = this.frame;

    THREE.Object3D.prototype.updateMatrixFirst = function() {
      if (
        !this.position.equals(zeroPos) ||
        !this.quaternion.equals(zeroQuat) ||
        !this.scale.equals(oneScale) ||
        !this.matrix.equals(identity)
      ) {
        this.updateMatrix();
      }

      this.hasHadFirstMatrixUpdate = true;
      this.matrixWorldNeedsUpdate = true;
    };

    THREE.Object3D.prototype.updateMatrix = function() {
      this.matrix.compose(
        this.position,
        this.quaternion,
        this.scale
      );
      this.matrixWorldNeedsUpdate = true;

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;
      }
    };

    THREE.Object3D.prototype.applyMatrix = function(matrix) {
      this.matrix.multiplyMatrices(matrix, this.matrix);
      this.matrix.decompose(this.position, this.quaternion, this.scale);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;
      }
    };

    THREE.Object3D.prototype.updateMatrixWorld = function(force /*, frame*/) {
      //if (!this.visible && this.hasHadFirstMatrixUpdate) return;

      if (!this.hasHadFirstMatrixUpdate) {
        this.updateMatrixFirst();
        this.cachedMatrixWorld = this.matrixWorld;
      } else if (this.matrixAutoUpdate || this.matrixNeedsUpdate) {
        this.updateMatrix();
        if (this.matrixNeedsUpdate) this.matrixNeedsUpdate = false;
      }

      if (this.matrixWorldNeedsUpdate || force) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          if (!this.matrixIsModified) {
            this.matrixWorld = this.parent.matrixWorld;
          } else {
            this.matrixWorld = this.cachedMatrixWorld;
            this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
          }
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
