import * as annotations from "../annotations/annotations.js";
import { AnnotationsCollection } from "./annotations_collection.js";
let annotationCollection;
let image;
let editable = false;
export function init() {
    document
        .getElementById("annotations")
        .addEventListener("click", annotationListButtonHandler);
}
export async function setupScreenshot(ss) {
    const $img = document.getElementById("screenshot_image");
    $img.src = ss.image_url;
    image = ss;
    const $ctr = document.getElementById("screenshot_container");
    const $canvas = document.getElementById("canvas");
    editable = user_id === ss.user_id;
    document.getElementById("editor").classList.toggle("editable", editable);
    let url_text = "";
    if (ss.source_url) {
        url_text = ss.source_url.replace(/https?:\/\//, "");
        url_text = `<a href="${ss.source_url}">${url_text}</a>`;
    }
    document.getElementById("source_url").innerHTML = url_text;
    await $img.decode();
    const width = $img.naturalWidth;
    const height = $img.naturalHeight;
    $ctr.style["width"] = `${width}px`;
    $ctr.style["height"] = `${height}px`;
    $canvas.width = width;
    $canvas.height = height;
    annotationCollection = new AnnotationsCollection($canvas, document.getElementById("annotations"), ss);
    if (editable) {
        $canvas.addEventListener("mousedown", beginAnnotation);
    }
}
function annotationListButtonHandler(evt) {
    const $target = evt.target;
    if ($target.nodeName === "BUTTON") {
        const $li = $target.closest("li");
        const annotation = $li.annotation;
        annotationCollection.removeAnnotation(annotation);
        $li.remove();
    }
}
function beginAnnotation(evt) {
    if (evt.button === 0) {
        const selector = '#annotation_tools input[name="tool"]:checked';
        const tool = document.querySelector(selector).value;
        const annotation_cls = annotations[`${tool}Annotation`];
        const a9n = new annotation_cls(document.getElementById("canvas"), annotationCollection);
        a9n.startHandling(evt);
    }
}
