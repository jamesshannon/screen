import * as navigation from "./navigation.js";
import { Screenshot } from "./editor/models.js";
/** @function Initialize the Upload Handlers on the home page */
export async function init() {
    // Add handlers for the dropzone (drag-and-drop)
    const $dropzone = document.getElementById("drop_zone");
    $dropzone.addEventListener("drop", (evt) => {
        evt.preventDefault();
        processItemsList(evt.dataTransfer?.files);
    });
    $dropzone.addEventListener("dragover", (evt) => {
        evt.preventDefault();
    });
    $dropzone.addEventListener("dragenter", (evt) => {
        evt.target.classList.add("dragenter");
        console.log("enter");
    });
    $dropzone.addEventListener("dragleave", (evt) => {
        evt.target.classList.remove("dragenter");
        console.log("leave");
    });
    // Add handlers for the upload element (file chooser)
    document
        .getElementById("upload_input")
        .addEventListener("change", (evt) => {
        // evt.target.files[] is File with type, but no getAsFile() or kind
        processItemsList(evt.target.files);
    });
    // Add handlers for pasting from the clipboard
    window.addEventListener("paste", (evt) => {
        processItemsList(evt.clipboardData?.files);
    });
    console.log("Added upload handlers");
}
/** @function Process a FileList to look for files to be uploaded */
// Events like drag-and-drop and clipboard paste provide a possible list of
// Blobs, some of which may be files, and some of those may be reasonable-
// sized images. If we find one, then create a new Screenshot and navigate
// to it.
// TODO: Surface some of the errors as a UI butter bar or something.
async function processItemsList(files) {
    if (files) {
        for (let file of files) {
            if (file.type.startsWith("image/")) {
                if (file.size > 1024 * 1024) {
                    console.error(`File ${file.name} too large.`);
                }
                else {
                    console.log("Got a valid file");
                    navigation.navigateToScreenshot(await Screenshot.create(file));
                }
                // Found a file which was either valid or invalid.
                // Skip any additional files.
                return;
            }
        }
    }
    console.warn("No valid file(s)");
}
