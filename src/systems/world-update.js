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

    const updateMatrix = THREE.Object3D.prototype.updateMatrix;
    THREE.Object3D.prototype.updateMatrix = function() {
      updateMatrix.apply(this, arguments);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;
      }
    };

    const applyMatrix = THREE.Object3D.prototype.applyMatrix;
    THREE.Object3D.prototype.applyMatrix = function() {
      applyMatrix.apply(this, arguments);

      if (!this.matrixIsModified) {
        this.matrixIsModified = true;
      }
    };

    THREE.Object3D.prototype.updateMatrixWorld = function(force, frame, parentMatrixWorld) {
      if (!this.visible && this.hasHadFirstMatrixUpdate) return;

      if (!this.hasHadFirstMatrixUpdate) {
        this.updateMatrixFirst();
        this.cachedMatrixWorld = this.matrixWorld;
      } else if (this.matrixAutoUpdate || this.matrixNeedsUpdate) {
        this.updateMatrix();
        if (this.matrixNeedsUpdate) this.matrixNeedsUpdate = false;
      } else {
        /*if (Math.random() < 0.0001) {
          this.updateMatrix();
          console.log(this);
        }*/
      }

      if (this.matrixWorldNeedsUpdate || force) {
        if (this.parent === null) {
          this.matrixWorld.copy(this.matrix);
        } else {
          // If the matrix is unmodified, it is the identity matrix,
          // and hence we can use the parent's world matrix.
          if (!this.matrixIsModified && parentMatrixWorld) {
            this.matrixWorld = parentMatrixWorld;
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
        children[i].updateMatrixWorld(force, frame, this.matrixWorld);
      }
    };
  },

  _patchRenderFunc: function() {
    const renderer = this.el.renderer;
    const render = renderer.render;

    renderer.render = (scene, camera, renderTarget) => {
      scene.updateMatrixWorld(true, this.frame);
      render.call(renderer, scene, camera, renderTarget);
      this.frame++;
    };
  }
});
