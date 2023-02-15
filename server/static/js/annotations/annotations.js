import { Annotation } from "./annotations_base.js";
import { Point } from "./point.js";
export { Annotation } from "./annotations_base.js";
export class TextAnnotation extends Annotation {
    constructor() {
        super(...arguments);
        this.display_name = "Text";
        this.text = "";
        this.font_size = 18;
        this.export_properties = ["start", "text"];
    }
    startHandling(evt) {
        super.startHandling(evt);
        const $div = document.createElement("div");
        $div.contentEditable = "true";
        $div.style.cssText = `
      top: ${this.start.y}px;
      left: ${this.start.x}px;
      font-size: ${this.font_size}px;
    `;
        const $container = document.getElementById("screenshot_container");
        $container.appendChild($div);
        $div.addEventListener("keydown", (evt) => this.blurOnKeypress(evt));
        $div.addEventListener("blur", (evt) => this.saveTextToCanvas(evt));
        setTimeout(() => $div.focus(), 0);
    }
    blurOnKeypress(evt) {
        if (evt.key === "Enter" || evt.key === "Escape") {
            evt.target.blur();
        }
    }
    saveTextToCanvas(evt) {
        const $div = evt.target;
        this.text = $div.innerText;
        $div.remove();
        if (this.text) {
            this.addToAnnotationCollection();
            this.annotationCollection.drawAll();
        }
    }
    draw(ctx) {
        ctx.font = `${this.font_size}px sans-serif`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 1;
        ctx.shadowColor = "#FFFFFF";
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeText(this.text, this.start.x, this.start.y + this.font_size);
        ctx.fillStyle = "#FF0000";
        ctx.fillText(this.text, this.start.x, this.start.y + this.font_size);
    }
}
class DrawAnnotation extends Annotation {
    constructor() {
        super(...arguments);
        this.lineWidth = 2;
        this.strokeStyle = "rgb(255, 0, 0)";
        this.lineCap = "butt";
        this.export_properties = ["start", "last"];
    }
    startHandling(evt) {
        super.startHandling(evt);
        this.addHandler("mousemove", this.moveHandler);
        this.addHandler("mouseup", this.upHandler);
    }
    moveHandler(evt) {
        this.last = new Point(evt.offsetX, evt.offsetY);
        this.lastSnap = evt.shiftKey;
        this.annotationCollection.drawAll(this);
    }
    upHandler(evt) {
        if (this.last) {
            this.addToAnnotationCollection();
        }
        this.removeHandlers();
    }
    applyStrokeStyle(ctx) {
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.lineCap = this.lineCap;
    }
}
export class LineAnnotation extends DrawAnnotation {
    constructor() {
        super(...arguments);
        this.display_name = "Line";
    }
    draw(ctx) {
        if (this.lastSnap) {
            const [diffX, diffY] = this.last.subtract(this.start).xy.map(Math.abs);
            if (diffX < diffY) {
                this.last.x = this.start.x;
            }
            else {
                this.last.y = this.start.y;
            }
        }
        ctx.beginPath();
        this.applyStrokeStyle(ctx);
        ctx.moveTo(...this.start.xy);
        ctx.lineTo(...this.last.xy);
        ctx.stroke();
    }
}
export class ArrowAnnotation extends LineAnnotation {
    constructor() {
        super(...arguments);
        this.display_name = "Arrow";
    }
    draw(ctx) {
        super.draw(ctx);
        const line_angle = (Math.atan2(this.last.y - this.start.y, this.last.x - this.start.x) *
            180) /
            Math.PI;
        const length = 15;
        for (let angle of [-35, 35]) {
            let pnt = new Point(Math.round(Math.cos(((line_angle + angle) * Math.PI) / 180) * length +
                this.start.x), Math.round(Math.sin(((line_angle + angle) * Math.PI) / 180) * length +
                this.start.y));
            ctx.beginPath();
            this.applyStrokeStyle(ctx);
            ctx.moveTo(...this.start.xy);
            ctx.lineTo(...pnt.xy);
            ctx.stroke();
        }
    }
}
export class HighlightAnnotation extends LineAnnotation {
    constructor() {
        super(...arguments);
        this.display_name = "Highlight";
        this.lineWidth = 15;
        this.strokeStyle = "rgba(255, 255, 0, 0.35)";
        this.lineCap = "round";
    }
}
export class BoxAnnotation extends DrawAnnotation {
    constructor() {
        super(...arguments);
        this.display_name = "Box";
    }
    draw(ctx) {
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
export class CircleAnnotation extends DrawAnnotation {
    constructor() {
        super(...arguments);
        this.display_name = "Circle";
        this.export_properties = ["start", "last", "lastSnap"];
    }
    draw(ctx) {
        ctx.beginPath();
        this.applyStrokeStyle(ctx);
        const [width, height] = this.last.subtract(this.start).xy;
        const center = new Point(this.start.x + width / 2, this.start.y + height / 2);
        if (this.lastSnap) {
            const radius = Math.abs(Math.max(width, height) / 2);
            ctx.arc(...center.xy, radius, 0, 2 * Math.PI, false);
        }
        else {
            ctx.ellipse(...center.xy, Math.abs(width) * 0.7, Math.abs(height) * 0.7, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
    }
}
export class BlurAnnotation extends DrawAnnotation {
    constructor(canvas, collection) {
        super(canvas, collection);
        this.display_name = "Blur";
        this.pixel_size = 5;
        const $img = document.getElementById("screenshot_image");
        const width = $img.naturalWidth;
        const height = $img.naturalHeight;
        const blur_width = width / this.pixel_size;
        const blur_height = height / this.pixel_size;
        const $bc = document.createElement("canvas");
        $bc.width = width;
        $bc.height = height;
        const ctx = $bc.getContext("2d");
        ctx.drawImage($img, 0, 0, blur_width, blur_height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage($bc, 0, 0, blur_width, blur_height, 0, 0, width, height);
        this.blurred_canvas = $bc;
    }
    draw(ctx) {
        const box_size = this.last.subtract(this.start);
        ctx.drawImage(this.blurred_canvas, ...this.start.xy, ...box_size.xy, ...this.start.xy, ...box_size.xy);
    }
}
