import { Point } from "./point.js";
export class Annotation {
    constructor(canvas, collection) {
        this.export_properties = [];
        this.handlers = [];
        this.canvas = canvas;
        this.annotationCollection = collection;
    }
    startHandling(evt) {
        this.start = new Point(evt.offsetX, evt.offsetY);
    }
    addToAnnotationCollection() {
        this.annotationCollection.addAnnotation(this);
    }
    addHandler(type, func) {
        const listener = func.bind(this);
        document.addEventListener(type, listener);
        this.handlers.push([type, listener]);
    }
    removeHandlers() {
        for (let [type, listener] of this.handlers) {
            document.removeEventListener(type, listener);
        }
        this.handlers = [];
    }
    draw(ctx) {
        throw new Error("Unimplemented draw()");
    }
    toJSON() {
        const returnobj = {};
        for (let prop of this.export_properties) {
            returnobj[prop] = this[prop];
        }
        return [this.constructor.name.replace("Annotation", ""), returnobj];
    }
}
