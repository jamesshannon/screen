var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * @fileoverview Entire app for the cropping page
 * This app accepts an image via a message, displays it, provides a UI for
 * cropping, and then immediately "uploads" it to the screen/ server
 */
chrome.runtime.onMessage.addListener(doScreenshotStuff);
const HOST = "http://localhost:8000/";
let source_url = "";
const $ss = document.getElementById("screenshot");
const $ctr = document.getElementById("container");
const $canvas = document.getElementById("crop_canvas");
const ctx = $canvas.getContext("2d");
let start;
let dimensions;
/** @function Parse the message and set up the cropping UI. */
function doScreenshotStuff(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.request === "UPLOAD") {
            // The action button was double-clicked. We should already have the
            // image loaded. Send the full page without cropping
            start = [0, 0];
            dimensions = [$ss.naturalWidth, $ss.naturalHeight];
            cropAndUploadImage();
        }
        else if (msg.request === "CROP") {
            // Display the image in the message and set up the cropping listener
            $ss.src = msg.ss_data;
            source_url = msg.source_url || "";
            // Pause until the image is loaded
            yield $ss.decode();
            // Set canvas width based on image width.
            // TODO: Natural width appears to be the # of density pixels (e.g. 2x display)
            // pixels. How to handle this?
            const width = $ss.naturalWidth;
            const height = $ss.naturalHeight;
            $canvas.width = width;
            $canvas.height = height;
            $ctr.style["width"] = `${width}px`;
            $ctr.style["height"] = `${height}px`;
            // setup the mouse event handler for drawing
            $canvas.addEventListener("mousedown", beginCropping);
            console.log("Set up screenshot for cropping");
        }
    });
}
/** @function Begin cropping, based on mousedown on the image. */
function beginCropping(evt) {
    start = [evt.offsetX, evt.offsetY];
    document.addEventListener("mousemove", moveHandler);
    document.addEventListener("mouseup", upHandler);
}
/** @function Redraw the cropping box based on mouse movement. */
function moveHandler(evt) {
    // x,y tuple with box dimensions. Can be negative (in which box is properly
    // drawn to up and/or to the left).
    dimensions = [evt.offsetX - start[0], evt.offsetY - start[1]];
    // Clear and re-draw the canvas for each mousemove
    ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.rect(...start, ...dimensions);
    ctx.closePath();
    ctx.stroke();
}
/** @function Crop and upload, based on mouseup. */
function upHandler() {
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", upHandler);
    cropAndUploadImage();
}
/** @function Crop and upload the image to the screen/ server. */
function cropAndUploadImage() {
    return __awaiter(this, void 0, void 0, function* () {
        // Absolute dimensions are needed for the canvas resizing
        const abs_dims = dimensions.map(Math.abs);
        // Re-use the canvas we've been using to draw the box. Re-size it to the
        // desired image size, then copy the cropped image to it.
        [$canvas.width, $canvas.height] = abs_dims;
        ctx.drawImage($ss, ...start, ...dimensions, 0, 0, ...abs_dims);
        // This is the b64-encoded 'data:...' string
        const cropped_data = $canvas.toDataURL();
        // Create GET URL for the hosting site which includes the image data and the
        // source URL. Image data is already URL-safe but source_url is not.
        source_url = encodeURI(source_url);
        const url = `${HOST}#img_data=${cropped_data}&source_url=${source_url}`;
        chrome.tabs.create({ url: url });
        const tab = yield chrome.tabs.getCurrent();
        chrome.tabs.remove(tab.id);
    });
}
