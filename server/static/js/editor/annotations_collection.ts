/** @fileoverview AnnotationsCollection class to maintain annotations. */
import * as annotations from "../annotations/annotations.js";
import type { Screenshot } from "./models.js";
import { Point } from "../annotations/point.js";

/**
 * @classdesc A collection of annotation instances for the current image.
 *     This holds all the annotations, keeps the <UL> tag in sync, and is in
 *     charge of redrawing on the canvas.
 */
export class AnnotationsCollection {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private annotation_element: HTMLUListElement;

  private ss: Screenshot;

  private annotations: Array<annotations.Annotation> = [];

  constructor(
    canvas: HTMLCanvasElement,
    element: HTMLUListElement,
    ss: Screenshot
  ) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;
    this.annotation_element = element;
    this.ss = ss;

    // Load any annotation data from the Screenshot and initialize Annotation
    // classes.
    // Update the Annotations list
    if (ss.annotations.length) {
      for (let a9n_data of ss.annotations) {
        let a9n_inst = new annotations[`${a9n_data[0]}Annotation`](
          this.canvas,
          this
        );
        for (let prop of Object.keys(a9n_data[1])) {
          let val: any = a9n_data[1][prop];
          if (Array.isArray(val) && val[0] === "P") {
            // Create this as a Point
            val = new Point(...(val[1] as [number, number]));
          }

          a9n_inst[prop] = val;
        }
        this.addAnnotation(a9n_inst, false);
      }

      this.drawAll();
    }
  }

  /**
   * @method Add annotation to the collection. Annotations should only be added
   *     if they're "ready" (ie, not while being drawn) rather than adding them
   *     then removing them if the drawing wasn't valid.
   * @param is_brand_new True when the annotation is new. Setting to false means
   *     the annotation was existing (ie, came from the Image). If the
   *     annotation is new then we save the updated annotations array to the
   *     server.
   */
  addAnnotation(
    annotation: annotations.Annotation,
    is_brand_new: boolean = true
  ): void {
    // We would theoretically want to drawAll() after this is done but
    // everything that adds an annotation has already drawn (in the case of
    // an annotation with a mouseup handler) or is adding a bunch and
    // manually draws at the end.
    this.annotations.push(annotation);

    // create a LI to add to the UL
    const $li = document.createElement("li");
    $li.innerHTML = `${annotation.display_name} <button>X</button>`;
    // Store the annotation object inside of the <LI> tag so that we know what
    // to remove from the collection when the <LI> is deleted.
    // @ts-ignore
    $li.annotation = annotation;

    this.annotation_element.appendChild($li);

    // This is the point we should sync with the server if it's a new Annotation
    // When the annotation was built from the server response we don't save
    if (is_brand_new) {
      this.ss.annotations = this.annotations;
      this.ss.save();
    }
  }

  /** @method Remove annotation from the collection and save to server. */
  removeAnnotation(annotation: annotations.Annotation): void {
    const idx = this.annotations.indexOf(annotation);
    this.annotations.splice(idx, 1);

    this.drawAll();

    this.ss.annotations = this.annotations;
    this.ss.save();
  }

  /**
   * @method Draw all annotations after clearing the canvas.
   * @param plus_one Also draw this other annotation. This is useful if you
   *     don't want to add the annotation to the collection yet (for annotations
   *     being actively drawn)
   */
  drawAll(plus_one?: annotations.Annotation): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.annotations.forEach((annotation) => annotation.draw(this.context));

    if (plus_one) {
      plus_one.draw(this.context);
    }
  }
}
