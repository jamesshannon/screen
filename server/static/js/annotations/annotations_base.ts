/** @fileoverview Base Annotation abstract class. */

import { Point } from "./point.js";
import type { AnnotationsCollection } from "../editor/annotations_collection.js";

/**
 * @classdesc Base Annotation represents all types of drawing and other
 *     annotations, including things like managing event listeners and saving
 *     to JSON.
 */
export abstract class Annotation {
  private canvas: HTMLCanvasElement;
  protected annotationCollection: AnnotationsCollection;
  /**
   * @property The Point where the mousedown first happened. All annotations
   *     have a starting point, even if they don't have an ending point (last).
   */
  protected start: Point;

  /**
   * @property Name for this annotation to display to the user. Right now it's
   *     used for the Annotations list in the UI.
   */
  display_name: string;

  /** @property List of properties that toJson() will export to an Object. */
  protected export_properties: Array<string> = [];

  /** @property Event handlers that the instance has set, to later remove. */
  private handlers: Array<[string, EventListener]> = [];

  constructor(canvas: HTMLCanvasElement, collection: AnnotationsCollection) {
    this.canvas = canvas;
    this.annotationCollection = collection;
  }

  /** @method Begin handling ("live editing") of the annotation. */
  // This implementation only sets the start position, which all Annotations
  // need. Subclass implementations will also install handlers and do other
  // stuff.
  startHandling(evt: MouseEvent): void {
    this.start = new Point(evt.offsetX, evt.offsetY);
  }

  /** @method Add annotation instance to the collection of annotations */
  protected addToAnnotationCollection(): void {
    // Needs to be called after drawing completed "successfully". Otherwise
    // aborted annotations (like text boxes with no text will persist.
    this.annotationCollection.addAnnotation(this);
  }

  /** @method Add document event listener. */
  protected addHandler(type: string, func: CallableFunction): void {
    // This helper function sets up the necessary `this` binding and adds the
    // listener to the handlers instance array so that it can be removed in
    // the future.
    const listener = func.bind(this) as EventListener;
    document.addEventListener(type, listener);
    this.handlers.push([type, listener]);
  }

  /** @method Automatically remove all event handlers which were added. */
  protected removeHandlers(): void {
    for (let [type, listener] of this.handlers) {
      document.removeEventListener(type, listener);
    }

    this.handlers = [];
  }

  /**
   * @method Draws the annotation on the canvas. Used during live drawing (once
   *     per mouse move event) and for recreating the annotation.
   */
  draw(ctx: CanvasRenderingContext2D): void {
    throw new Error("Unimplemented draw()");
  }

  /** @method Create a JSON-able representation of this annotation */
  toJSON(): [string, object] {
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
