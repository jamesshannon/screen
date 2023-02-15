import * as navigation from "./navigation.js";
import { Screenshot } from "./editor/models.js";
export async function init() {
    const $dropzone = document.getElementById("drop_zone");
    $dropzone.addEventListener("drop", (evt) => {
        var _a;
        evt.preventDefault();
        processItemsList((_a = evt.dataTransfer) === null || _a === void 0 ? void 0 : _a.files);
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
    document
        .getElementById("upload_input")
        .addEventListener("change", (evt) => {
        processItemsList(evt.target.files);
    });
    window.addEventListener("paste", (evt) => {
        var _a;
        processItemsList((_a = evt.clipboardData) === null || _a === void 0 ? void 0 : _a.files);
    });
    console.log("Added upload handlers");
}
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
                return;
            }
        }
    }
    console.warn("No valid file(s)");
}
