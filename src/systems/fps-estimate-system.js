const MS_CAP = 2000;
class Estimator {
  constructor() {
    this.dts = [];
    this.totalMs = 0;
    this.mostRecentEstimate = 0;
  }
  push(dt) {
    if (!this.didIgnoreLongFrame && dt > this.mostRecentEstimate * 4) {
      this.didIgnoreLongFrame = true;
      return;
    }
    this.didIgnoreLongFrame = false;
    while (this.dts.length && this.totalMs > MS_CAP) {
      this.drop();
    }
    this.totalMs += dt;
    this.dts.push(dt);
  }

  drop() {
    this.totalMs -= this.dts.splice(0, 1)[0];
  }

  estimate() {
    let sum = 0;
    let totalWeight = 0;
    let est = 0;
    for (let i = 0; i < this.dts.length; i++) {
      const val = this.dts[i];
      sum += val;
      const weight = sum;
      est += val * weight;
      totalWeight += weight;
    }
    this.mostRecentEstimate = est / totalWeight;
    return this.mostRecentEstimate;
  }
}

export class FPSEstimateSystem {
  constructor() {
    this.estimator = new Estimator();
    this.efps = 10;
  }

  tick(dt) {
    this.estimator.push(dt);
    this.efps = 1000 / this.estimator.estimate();
  }
}
