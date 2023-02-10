import * as annotations from "../annotations/annotations.js";
import { AnnotationsCollection } from "./annotations_collection.js";
/** Module-level variables to maintain some editor state. */
let annotationCollection;
let image;
/** @function Initialize the editor module. Run once per SPA load. */
export function init() {
    document
        .getElementById("annotations")
        .addEventListener("click", annotationListButtonHandler);
}
/** @function Setup editor experience for a `Screenshot` */
export async function setupScreenshot(ss) {
    // Load the `Screenshot` image into the <img> tag
    const $img = document.getElementById("screenshot_image");
    $img.src = ss.image_url;
    // save the Screenshot to the module-scoped variable
    image = ss;
    const $ctr = document.getElementById("screenshot_container");
    const $canvas = document.getElementById("canvas");
    // Update the Source URL text
    let url_text = "";
    if (ss.source_url) {
        url_text = ss.source_url.replace(/https?:\/\//, "");
        url_text = `<a href="${ss.source_url}">${url_text}</a>`;
    }
    document.getElementById("source_url").innerHTML = url_text;
    // Wait for image to be ready
    await $img.decode();
    // Setup the editor container based on image size.
    const width = $img.naturalWidth;
    const height = $img.naturalHeight;
    $ctr.style["width"] = `${width}px`;
    $ctr.style["height"] = `${height}px`;
    $canvas.width = width;
    $canvas.height = height;
    annotationCollection = new AnnotationsCollection($canvas, document.getElementById("annotations"), ss);
    // #### TODO: Does this add multiple event handlers????
    $canvas.addEventListener("mousedown", beginAnnotation);
}
/** @function Handle the annotation list "(X)" button to delete annotations. */
function annotationListButtonHandler(evt) {
    const $target = evt.target;
    if ($target.nodeName === "BUTTON") {
        const $li = $target.closest("li");
        // Get the Annotation which we saved inside the HTML element
        // @ts-ignore
        const annotation = $li.annotation;
        annotationCollection.removeAnnotation(annotation);
        $li.remove();
    }
}
/**
 * @function Begin drawing an annotation on the canvas in response to a
 *     `mousedown` event on the canvas.
 */
function beginAnnotation(evt) {
    // Only respond to right-clicks
    if (evt.button === 0) {
        // Instantiate the correct annotation class based on the selected tool
        const selector = '#annotation_tools input[name="tool"]:checked';
        const tool = document.querySelector(selector).value;
        const annotation_cls = annotations[`${tool}Annotation`];
        const a9n = new annotation_cls(document.getElementById("canvas"), annotationCollection);
        a9n.startHandling(evt);
    }
}
