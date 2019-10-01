import qsTruthy from "../utils/qs_truthy";
import { paths } from "./userinput/paths";
const qs = new URLSearchParams(location.search);
const ANIMATION_MS = 120;
const MIN_RES_DELTA = 0.02;
const EPS = 0.001;
const BACKGROUND_TIMEOUT = 15000;
const USER_COMMAND_TIMEOUT_DURATION = 5000;
const ULTRA_HIGH_FRAMERATE = parseInt(qs.get("uhfps")) || 60;
const HIGH_FRAMERATE = parseInt(qs.get("hfps")) || 45;
const HIGH_FRAMERATE_STILL = 22;
const LOW_FRAMERATE = parseInt(qs.get("lfps")) || 30;
const LOW_FRAMERATE_STILL = 12;
const ULTRA_LOW_FRAMERATE = parseInt(qs.get("ulfps")) || 8;
const MIN_FRAMERATE = 8;
const MIN_FOREGROUND_RESOLUTION_FACTOR = 0.01;
const MIN_BACKGROUND_RESOLUTION_FACTOR = 0.02;
const MIN_WIDTH_OR_HEIGHT_PX = 100;
const enableAdaptiveResolution = qsTruthy("ar");

const lerp = function(a, b, t) {
  return THREE.Math.clamp(t * b + (1 - t) * a, a < b ? a : b, a < b ? b : a);
};

function easeOutQuadratic(t) {
  return t * (2 - t);
}

export class AdaptiveResolutionSystem {
  constructor() {
    this.resolutionFactor = 1;
    this.lastAppliedResolutionFactor = 1;
    this.targetResolutionFactor = 1;
    this.resolutionFactorStartValue = 1;
    this.resolutionFactorStartTime = 0;
    this.lastFpsUpdate = 0;
    this.fps = 55;
    this.lastUserCommandT = -USER_COMMAND_TIMEOUT_DURATION;

    this.canvasSizeEl = document.createElement("div");
    this.canvasSizeEl.classList.add("rs-canvas-size-counter");
    document.body.appendChild(this.canvasSizeEl);
    this.estFpsEl = document.createElement("div");
    this.estFpsEl.classList.add("rs-fps-counter-2");
    document.body.appendChild(this.estFpsEl);

    window.addEventListener("resize", () => {
      // Workaround for a Webkit bug (https://bugs.webkit.org/show_bug.cgi?id=170595)
      // where the window does not contain the correct viewport size
      // after an orientation change. The window size is correct if the operation
      // is postponed a few milliseconds.
      // self.resize can be called directly once the bug above is fixed.
      if (AFRAME.utils.device.isIOS()) {
        setTimeout(() => {
          this.windowDidResize = true;
        }, 100);
      } else {
        this.windowDidResize = true;
      }
    });
  }
  tick(userinput, scene, t, efps) {
    if (!this.resizeOverride) {
      scene.resize = () => {};
      this.resizeOverride = true;
    }
    if (!enableAdaptiveResolution) {
      return;
    }
    this.t = t;
    this.characterController =
      this.characterController || document.getElementById("avatar-rig").components["character-controller"];
    this.fps = efps;
    this.estFpsEl.innerHTML = `${Math.round(efps)} efps`;

    const isLoading = scene.is("loader");
    if (isLoading) {
      scene.canvas.width = 1;
      scene.canvas.height = 1;
    } else {
      const userinput = scene.systems.userinput;
      const isUserCommand =
        userinput.get(paths.actions.decreaseResolution) || userinput.get(paths.actions.increaseResolution);
      const mayChangeResolution = isUserCommand || this.t - this.lastUserCommandT > USER_COMMAND_TIMEOUT_DURATION;
      if (isUserCommand) {
        this.lastUserCommandT = this.t;
      }
      const cameraDelta = userinput.get(
        scene.is("entered") ? paths.actions.cameraDelta : paths.actions.lobbyCameraDelta
      );
      const movedCameraThisFrame = cameraDelta && Math.abs(cameraDelta[0]) > EPS && Math.abs(cameraDelta[1]) > EPS;
      if (movedCameraThisFrame) {
        this.lastMovedCameraT = this.t;
      }
      this.didMoveCamera = this.didMoveCamera || movedCameraThisFrame;
      const timeSinceMovement =
        (!scene.is("entered") && !this.didMoveCamera) || this.windowDidResize
          ? 0
          : this.t - Math.max(this.lastMovedCameraT, this.characterController.timeOfLastMovement);
      const resup =
        mayChangeResolution &&
        timeSinceMovement < BACKGROUND_TIMEOUT &&
        (this.fps > HIGH_FRAMERATE ||
          (this.fps > HIGH_FRAMERATE_STILL && timeSinceMovement > 50) ||
          (this.fps > LOW_FRAMERATE_STILL && timeSinceMovement > 50) ||
          (this.fps > ULTRA_LOW_FRAMERATE && timeSinceMovement > 100) ||
          (this.fps > MIN_FRAMERATE && timeSinceMovement > 150));
      if (
        !userinput.get(paths.actions.decreaseResolution) &&
        (userinput.get(paths.actions.increaseResolution) || resup)
      ) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
        const dr = userinput.get(paths.actions.increaseResolution)
          ? 0.01 + 0.02 * (this.targetResolutionFactor * this.targetResolutionFactor)
          : this.fps > LOW_FRAMERATE_STILL && timeSinceMovement > 50
            ? 0.05
            : this.fps > ULTRA_HIGH_FRAMERATE
              ? 0.1
              : this.fps > HIGH_FRAMERATE
                ? 0.05
                : this.fps > LOW_FRAMERATE
                  ? 0.03
                  : this.fps > ULTRA_LOW_FRAMERATE
                    ? 0.03
                    : 0.01;
        this.targetResolutionFactor = Math.min(1, this.targetResolutionFactor + dr);
      }
      const resdown =
        !resup &&
        !userinput.get(paths.actions.increaseResolution) &&
        mayChangeResolution &&
        (this.fps < MIN_FRAMERATE ||
          (this.fps < ULTRA_LOW_FRAMERATE && (timeSinceMovement < 50 || timeSinceMovement > BACKGROUND_TIMEOUT)) ||
          (this.fps < LOW_FRAMERATE && timeSinceMovement < 50));
      if (userinput.get(paths.actions.decreaseResolution) || resdown) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
        const dr = userinput.get(paths.actions.decreaseResolution)
          ? 0.01 + 0.05 * (this.targetResolutionFactor * this.targetResolutionFactor)
          : this.fps < MIN_FRAMERATE
            ? 0.16
            : this.fps < ULTRA_LOW_FRAMERATE
              ? 0.1
              : this.fps < LOW_FRAMERATE
                ? 0.06
                : this.fps < HIGH_FRAMERATE
                  ? 0.04
                  : 0.02;

        this.targetResolutionFactor = Math.max(
          this.didMoveCamera && timeSinceMovement > BACKGROUND_TIMEOUT
            ? MIN_BACKGROUND_RESOLUTION_FACTOR
            : MIN_FOREGROUND_RESOLUTION_FACTOR,
          this.targetResolutionFactor - dr
        );
      }
      if (this.wasLoading) {
        this.resolutionFactorStartTime = this.t;
        this.resolutionFactorStartValue = this.resolutionFactor;
      }

      const progress = isUserCommand
        ? 1
        : easeOutQuadratic(Math.min(1, 0.01 + (this.t - this.resolutionFactorStartTime) / ANIMATION_MS));
      this.resolutionFactor = lerp(this.resolutionFactorStartValue, this.targetResolutionFactor, progress);

      if (
        !scene.is("vr-mode") &&
        (Math.abs(this.resolutionFactor - this.lastAppliedResolutionFactor) > MIN_RES_DELTA ||
          this.windowDidResize ||
          this.resolutionFactor === MIN_FOREGROUND_RESOLUTION_FACTOR ||
          (this.wasLoading && !isLoading))
      ) {
        this.windowDidResize = false;
        this.lastAppliedResolutionFactor = this.resolutionFactor;
        //scene.canvas.width = this.resolutionFactor * window.innerWidth;
        //scene.canvas.height = this.resolutionFactor * window.innerHeight;
        const pixelRatio = scene.renderer.getPixelRatio();
        let width = this.resolutionFactor * window.innerWidth * pixelRatio;
        let height = this.resolutionFactor * window.innerHeight * pixelRatio;
        if (width < MIN_WIDTH_OR_HEIGHT_PX || height < MIN_WIDTH_OR_HEIGHT_PX) {
          if (width < height) {
            height = (MIN_WIDTH_OR_HEIGHT_PX * height) / width;
            width = MIN_WIDTH_OR_HEIGHT_PX;
          } else {
            width = (MIN_WIDTH_OR_HEIGHT_PX * width) / height;
            height = MIN_WIDTH_OR_HEIGHT_PX;
          }
        }
        width = Math.round(width);
        height = Math.round(height);
        //scene.canvas.width = width;
        //scene.canvas.height = height;
        //scene.canvas.style.width = `${width}px`;
        //scene.canvas.style.height = `${height}px`;
        this.canvasSizeEl.innerHTML = `${width}x${height}`;
        scene.renderer.setSize(width / pixelRatio, height / pixelRatio, false);
        scene.emit("rendererresize", null, false);
      }
    }
    this.wasLoading = isLoading;
  }
}
