/** @fileoverview Base Annotation abstract class. */
import { Point } from "./point.js";
/**
 * @classdesc Base Annotation represents all types of drawing and other
 *     annotations, including things like managing event listeners and saving
 *     to JSON.
 */
export class Annotation {
    constructor(canvas, collection) {
        /** @property List of properties that toJson() will export to an Object. */
        this.export_properties = [];
        /** @property Event handlers that the instance has set, to later remove. */
        this.handlers = [];
        this.canvas = canvas;
        this.annotationCollection = collection;
    }
    /** @method Begin handling ("live editing") of the annotation. */
    // This implementation only sets the start position, which all Annotations
    // need. Subclass implementations will also install handlers and do other
    // stuff.
    startHandling(evt) {
        this.start = new Point(evt.offsetX, evt.offsetY);
    }
    /** @method Add annotation instance to the collection of annotations */
    addToAnnotationCollection() {
        // Needs to be called after drawing completed "successfully". Otherwise
        // aborted annotations (like text boxes with no text will persist.
        this.annotationCollection.addAnnotation(this);
    }
    /** @method Add document event listener. */
    addHandler(type, func) {
        // This helper function sets up the necessary `this` binding and adds the
        // listener to the handlers instance array so that it can be removed in
        // the future.
        const listener = func.bind(this);
        document.addEventListener(type, listener);
        this.handlers.push([type, listener]);
    }
    /** @method Automatically remove all event handlers which were added. */
    removeHandlers() {
        for (let [type, listener] of this.handlers) {
            document.removeEventListener(type, listener);
        }
        this.handlers = [];
    }
    /**
     * @method Draws the annotation on the canvas. Used during live drawing (once
     *     per mouse move event) and for recreating the annotation.
     */
    draw(ctx) {
        throw new Error("Unimplemented draw()");
    }
    /** @method Create a JSON-able representation of this annotation */
    toJSON() {
        // Note that this doesn't actually return JSON, simply primitives that can
        // be easily converted to appropriate JSON.
        // This format is a tuple in the form of [ANNOTATION_TYPE, {PROPS}]
        // where props are the properties in the class' `export_properties` array.
        const returnobj = {};
        for (let prop of this.export_properties) {
            returnobj[prop] = this[prop];
        }
        return [this.constructor.name.replace("Annotation", ""), returnobj];
    }
}
