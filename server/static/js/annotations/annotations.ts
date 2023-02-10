/** @fileoverview Classes that are used to annotate the image. */
import { Annotation } from "./annotations_base.js";
import { Point } from "./point.js";
import type { AnnotationsCollection } from "../editor/annotations_collection.js";

export { Annotation } from "./annotations_base.js";

/** @classdesc Represents an annotation string of text written on image */
export class TextAnnotation extends Annotation {
  display_name = "Text";
  /** @property The text string that is written. */
  protected text: string = "";

  /** @property Hard-coded font size */
  protected font_size: number = 18;

  protected export_properties = ["start", "text"];

  startHandling(evt: MouseEvent): void {
    super.startHandling(evt);

    // You can't type onto a canvas. Create a div and place it on top of the
    // canvas at the point of the click.
    const $div = document.createElement("div");
    $div.contentEditable = "true";
    $div.style.cssText = `
      top: ${this.start.y}px;
      left: ${this.start.x}px;
      font-size: ${this.font_size}px;
    `;
    const $container = document.getElementById("screenshot_container")!;
    $container.appendChild($div);

    // Add the event listeners to the *div*.
    // No need to remove these later since we delete the element
    $div.addEventListener("keydown", (evt) => this.blurOnKeypress(evt));
    $div.addEventListener("blur", (evt) => this.saveTextToCanvas(evt));

    // We do this since calling .focus() directly doesn't work
    setTimeout(() => $div.focus(), 0);
  }

  /** @method Event handler for "saving" text on Enter or Escape keys */
  protected blurOnKeypress(evt: KeyboardEvent): void {
    if (evt.key === "Enter" || evt.key === "Escape") {
      (evt.target! as HTMLDivElement).blur();
    }
  }

  /** @method Copy text from div and call draw() to save to canvas.*/
  protected saveTextToCanvas(evt: FocusEvent): void {
    // This is separate from draw() because there are circumstances that we
    // need to draw but there has been no `div`, specifically after
    // instantiating from an Image
    const $div = evt.target as HTMLDivElement;
    this.text = $div.innerText;
    $div.remove();

    if (this.text) {
      // Only draw to the canvas and add to the collection if there was some
      // text. Otherwise silently fail.
      this.addToAnnotationCollection();
      this.annotationCollection.drawAll();
    }
  }

  /** @method Draw to canvas based on `this.text` */
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.font = `${this.font_size}px sans-serif`;

    // Add the stroke then add the text on top -- this creates a white outline
    // which aids in readability on some backgrounds.
    ctx.lineWidth = 1;
    ctx.shadowBlur = 1;
    ctx.shadowColor = "#FFFFFF";
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeText(this.text, this.start.x, this.start.y + this.font_size);

    ctx.fillStyle = "#FF0000";
    ctx.fillText(this.text, this.start.x, this.start.y + this.font_size);
  }
}

/** @classdesc Abstract class for Annotations that use lines and shapes. */
abstract class DrawAnnotation extends Annotation {
  /** @property Most recent mouse location */
  protected last: Point;
  /** @property Whether or not snap-to-place (shift) was done most recently. */
  protected lastSnap: boolean;

  /** @property Default stroke line width, to be overridden in child classes. */
  protected lineWidth: number = 2;
  /** @property Default stroke style, tp be overridden in child classes.  */
  protected strokeStyle: string = "rgb(255, 0, 0)";
  /** @property Default line cap, to be overridden in child classes. */
  protected lineCap: CanvasLineCap = "butt";

  protected export_properties = ["start", "last"];

  /** @property All DrawAnnotations use mouse movement and mouseups */
  protected moveHandlerFunc: EventListener;
  /** @property All DrawAnnotations use mouse movement and mouseups */
  protected upHandlerFunc: EventListener;

  startHandling(evt: MouseEvent): void {
    super.startHandling(evt);

    // All DrawAnnotations use mouse movement and mouseup, so we set the
    // handlers here.
    this.addHandler("mousemove", this.moveHandler);
    this.addHandler("mouseup", this.upHandler);
  }

  /** @method Handles mousemove events -- updates properties, and redraws. */
  protected moveHandler(evt: MouseEvent): void {
    this.last = new Point(evt.offsetX, evt.offsetY);
    this.lastSnap = evt.shiftKey;

    this.annotationCollection.drawAll(this);
  }

  /** @method Handles mouseup events -- decides to persist or ignore. */
  protected upHandler(evt: MouseEvent): void {
    // only save this annotation if there was some movement
    // this excludes errant clicks
    if (this.last) {
      this.addToAnnotationCollection();
    }

    this.removeHandlers();
  }

  /** @method Helper to apply stroke style from instance values. */
  protected applyStrokeStyle(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineCap = this.lineCap;
  }
}

/** @classdesc Class for lines, and parent for other line-based annotations */
export class LineAnnotation extends DrawAnnotation {
  display_name = "Line";

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.lastSnap) {
      // If the snap modifier (shift) is pressed then figure out on
      // which axis the current position is closest to the start
      // position, and then update our current position to be on
      // that axis.
      const [diffX, diffY] = this.last.subtract(this.start).xy.map(Math.abs);

      if (diffX < diffY) {
        this.last.x = this.start.x;
      } else {
        this.last.y = this.start.y;
      }
    }

    // Draw the line
    ctx.beginPath();
    this.applyStrokeStyle(ctx);
    ctx.moveTo(...this.start.xy);
    ctx.lineTo(...this.last.xy);
    ctx.stroke();
  }
}

/** @classdesc Arrows are Lines with an arrowhead at the start end */
export class ArrowAnnotation extends LineAnnotation {
  display_name = "Arrow";

  draw(ctx: CanvasRenderingContext2D): void {
    // calculate any snapping and draw the body of the arrow
    super.draw(ctx);

    // now draw the arrow head
    const line_angle =
      (Math.atan2(this.last.y - this.start.y, this.last.x - this.start.x) *
        180) /
      Math.PI;

    /** Length of arrow-head lines */
    const length = 15;

    // Arrow-heads are +/- 35 degrees from the angle of the line.
    for (let angle of [-35, 35]) {
      // Determine the point of the end of the arrow-head
      let pnt = new Point(
        Math.round(
          Math.cos(((line_angle + angle) * Math.PI) / 180) * length +
            this.start.x
        ),
        Math.round(
          Math.sin(((line_angle + angle) * Math.PI) / 180) * length +
            this.start.y
        )
      );

      ctx.beginPath();
      this.applyStrokeStyle(ctx);
      ctx.moveTo(...this.start.xy);
      ctx.lineTo(...pnt.xy);
      ctx.stroke();
    }
  }
}

/** @classdesc Highlighter is just a thick translucent yellow line. */
export class HighlightAnnotation extends LineAnnotation {
  display_name = "Highlight";

  protected lineWidth: number = 15;
  protected strokeStyle: string = "rgba(255, 255, 0, 0.35)";
  protected lineCap: CanvasLineCap = "round";
}

/** @classdesc Box Annotation has same editing UI but different drawing. */
export class BoxAnnotation extends DrawAnnotation {
  display_name = "Box";

  draw(ctx: CanvasRenderingContext2D): void {
    const distPoint = this.last.subtract(this.start);

    if (this.lastSnap) {
      const minDist = Math.abs(Math.min(...distPoint.xy));
      distPoint.x = Math.sign(distPoint.x) * minDist;
      distPoint.y = Math.sign(distPoint.y) * minDist;
      this.last.x = this.start.x + distPoint.x;
      this.last.y = this.start.y + distPoint.y;
    }

    ctx.beginPath();
    this.applyStrokeStyle(ctx);
    ctx.rect(...this.start.xy, ...distPoint.xy);
    ctx.closePath();
    ctx.stroke();
  }
}

/** @classdesc Draws an oval or a circle. */
export class CircleAnnotation extends DrawAnnotation {
  display_name = "Circle";
  // Unlike the lines, in which the snap modifier causes the last value to be
  // modified in-situ, the snap modifier causes a completely different shape
  // to be drawn, and so we need to persist that value
  protected export_properties = ["start", "last", "lastSnap"];

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    this.applyStrokeStyle(ctx);

    const [width, height] = this.last.subtract(this.start).xy;
    const center = new Point(
      this.start.x + width / 2,
      this.start.y + height / 2
    );
    if (this.lastSnap) {
      // draw a circle when shift key is down
      const radius = Math.abs(Math.max(width, height) / 2);

      ctx.arc(...center.xy, radius, 0, 2 * Math.PI, false);
    } else {
      // otherwise draw an oval
      // The oval tends to expand far beyond the cursor, so the 0.7 compensates
      // for that.
      ctx.ellipse(
        ...center.xy,
        Math.abs(width) * 0.7,
        Math.abs(height) * 0.7,
        0,
        0,
        Math.PI * 2
      );
    }

    ctx.stroke();
  }
}

/** @classdesc Draws a pixelated box based on the source image on the canvas. */
export class BlurAnnotation extends DrawAnnotation {
  // This is kinda v1.
  // It does not edit the actual image, so the underlying image still has the
  // unpixelated data.
  // This is easy enough to do programmatically -- just creata a canvas based
  // on the original image, add the blur and no other annotations, then upload
  // it, and don't save to the annotations list.
  // It's mostly a UI question. Should the saving be "invisible" in the editor
  // UI? Maybe an alert or notice or something? We probably don't want to
  // buid a "save to server" UI.
  // This pixelates the underlying image and not the image + existing
  // annotations, which is probably fine? When we save a pixelated version to
  // the server then the annotations wil be on top amyways.
  display_name = "Blur";
  /** @property Pixelation level. Higher numbers are more pixelated. */
  private pixel_size = 5;

  /** @property Canvas element with pixelated version of the soruce image. */
  private blurred_canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, collection: AnnotationsCollection) {
    super(canvas, collection);
    // Create a blurred copy of the image in memory that we can later draw onto
    // the real canvas
    const $img = document.getElementById(
      "screenshot_image"
    )! as HTMLImageElement;
    const width = $img.naturalWidth;
    const height = $img.naturalHeight;
    const blur_width = width / this.pixel_size;
    const blur_height = height / this.pixel_size;

    const $bc = document.createElement("canvas");
    $bc.width = width;
    $bc.height = height;
    const ctx = $bc.getContext("2d")!;

    // Draw a small version of the image onto the canvas
    ctx.drawImage($img, 0, 0, blur_width, blur_height);
    // Redraw it onto the same canvas at full size
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage($bc, 0, 0, blur_width, blur_height, 0, 0, width, height);

    this.blurred_canvas = $bc;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const box_size = this.last.subtract(this.start);

    ctx.drawImage(
      this.blurred_canvas,
      ...this.start.xy,
      ...box_size.xy,
      ...this.start.xy,
      ...box_size.xy
    );
  }
}
