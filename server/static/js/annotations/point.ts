/** @fileoverview Point class. */

/** @classdesc Represents a x,y point */
export class Point {
  x: number;
  y: number;

  /** @method Create a Point from x,y coordinates */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** @property x,y tuple, useful for passing to some methods */
  get xy(): [number, number] {
    return [this.x, this.y];
  }

  /** @property y,x tuple, useful for passing to some methods */
  get yx(): [number, number] {
    return [this.y, this.x];
  }

  /** @method Subtract a Point from this Point and return a new Point */
  subtract(point: Point): Point {
    return new Point(this.x - point.x, this.y - point.y);
  }

  /** @method Return a JSON-able representation in the form of ["P", [x, y]] */
  toJSON(): [string, [number, number]] {
    return ["P", [this.x, this.y]];
  }
}
