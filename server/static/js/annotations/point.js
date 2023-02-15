export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get xy() {
        return [this.x, this.y];
    }
    get yx() {
        return [this.y, this.x];
    }
    subtract(point) {
        return new Point(this.x - point.x, this.y - point.y);
    }
    toJSON() {
        return ["P", [this.x, this.y]];
    }
}
