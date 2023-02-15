/** @fileoverview Screenshot editor module */
import { Screenshot } from "./models.js";
import * as annotations from "../annotations/annotations.js";
import { Point } from "../annotations/point.js";
import { AnnotationsCollection } from "./annotations_collection.js";

/** Module-level variables to maintain some editor state. */
let annotationCollection: AnnotationsCollection;
let image: Screenshot;
let editable = false;

/** @function Initialize the editor module. Run once per SPA load. */
export function init() {
  document
    .getElementById("annotations")!
    .addEventListener("click", annotationListButtonHandler);
}

/** @function Setup editor experience for a `Screenshot` */
export async function setupScreenshot(ss: Screenshot): Promise<void> {
  // Load the `Screenshot` image into the <img> tag
  const $img = document.getElementById("screenshot_image")! as HTMLImageElement;
  $img.src = ss.image_url;

  // save the Screenshot to the module-scoped variable
  image = ss;

  const $ctr = document.getElementById("screenshot_container")!;
  const $canvas = document.getElementById("canvas")! as HTMLCanvasElement;

  editable = user_id === ss.user_id;
  document.getElementById("editor").classList.toggle("editable", editable);

  // Update the Source URL text
  let url_text = "";
  if (ss.source_url) {
    url_text = ss.source_url.replace(/https?:\/\//, "");
    url_text = `<a href="${ss.source_url}">${url_text}</a>`;
  }

  document.getElementById("source_url")!.innerHTML = url_text;

  // Wait for image to be ready
  await $img.decode();

  // Setup the editor container based on image size.
  const width = $img.naturalWidth;
  const height = $img.naturalHeight;

  $ctr.style["width"] = `${width}px`;
  $ctr.style["height"] = `${height}px`;

  $canvas.width = width;
  $canvas.height = height;

  annotationCollection = new AnnotationsCollection(
    $canvas,
    document.getElementById("annotations")! as HTMLUListElement,
    ss
  );

  if (editable) {
    // #### TODO: Does this add multiple event handlers????
    $canvas.addEventListener("mousedown", beginAnnotation);
  }
}

/** @function Handle the annotation list "(X)" button to delete annotations. */
function annotationListButtonHandler(evt: MouseEvent) {
  const $target = evt.target! as HTMLElement;
  if ($target.nodeName === "BUTTON") {
    const $li = $target.closest("li")!;
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
function beginAnnotation(evt: MouseEvent) {
  // Only respond to right-clicks
  if (evt.button === 0) {
    // Instantiate the correct annotation class based on the selected tool
    const selector = '#annotation_tools input[name="tool"]:checked';
    const tool = (document.querySelector(selector)! as HTMLFormElement).value;
    const annotation_cls = annotations[`${tool}Annotation`];

    const a9n: annotations.Annotation = new annotation_cls(
      document.getElementById("canvas")! as HTMLCanvasElement,
      annotationCollection
    );
    a9n.startHandling(evt);
  }
}
