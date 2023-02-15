import * as annotations from "../annotations/annotations.js";
import { Point } from "../annotations/point.js";
export class AnnotationsCollection {
    constructor(canvas, element, ss) {
        this.annotations = [];
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.annotation_element = element;
        this.ss = ss;
        if (ss.annotations.length) {
            for (let a9n_data of ss.annotations) {
                let a9n_inst = new annotations[`${a9n_data[0]}Annotation`](this.canvas, this);
                for (let prop of Object.keys(a9n_data[1])) {
                    let val = a9n_data[1][prop];
                    if (Array.isArray(val) && val[0] === "P") {
                        val = new Point(...val[1]);
                    }
                    a9n_inst[prop] = val;
                }
                this.addAnnotation(a9n_inst, false);
            }
            this.drawAll();
        }
    }
    addAnnotation(annotation, is_brand_new = true) {
        this.annotations.push(annotation);
        const $li = document.createElement("li");
        $li.innerHTML = `${annotation.display_name} <button>X</button>`;
        $li.annotation = annotation;
        this.annotation_element.appendChild($li);
        if (is_brand_new) {
            this.ss.annotations = this.annotations;
            this.ss.save();
        }
    }
    removeAnnotation(annotation) {
        const idx = this.annotations.indexOf(annotation);
        this.annotations.splice(idx, 1);
        this.drawAll();
        this.ss.annotations = this.annotations;
        this.ss.save();
    }
    drawAll(plus_one) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.annotations.forEach((annotation) => annotation.draw(this.context));
        if (plus_one) {
            plus_one.draw(this.context);
        }
    }
}
