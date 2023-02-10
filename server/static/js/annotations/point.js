/** @fileoverview Point class. */
/** @classdesc Represents a x,y point */
export class Point {
    /** @method Create a Point from x,y coordinates */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /** @property x,y tuple, useful for passing to some methods */
    get xy() {
        return [this.x, this.y];
    }
    /** @property y,x tuple, useful for passing to some methods */
    get yx() {
        return [this.y, this.x];
    }
    /** @method Subtract a Point from this Point and return a new Point */
    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }
    /** @method Return a JSON-able representation in the form of ["P", [x, y]] */
    toJSON() {
        return ["P", [this.x, this.y]];
    }
}
