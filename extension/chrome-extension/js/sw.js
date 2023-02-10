var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/** Extension service worker to listen for click event and open crop page. */
chrome.action.onClicked.addListener(capture);
/** @function Handle the action button click and open crop page. */
function capture() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: check if tab is
        const [active_tab] = yield chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
        });
        // Check if we're cropping the crop page, in which case that means "I don't
        // want to crop -- send the full screenshot".
        if ((_a = active_tab.url) === null || _a === void 0 ? void 0 : _a.includes(chrome.runtime.id)) {
            // Tell the tab to upload the full image
            chrome.tabs.sendMessage(active_tab.id, { request: "UPLOAD" });
        }
        else {
            const capture_request = chrome.tabs.captureVisibleTab({ format: "png" });
            const tab_request = chrome.tabs.create({
                url: chrome.runtime.getURL("/crop.html"),
            });
            const capture = yield capture_request;
            const crop_tab = yield tab_request;
            // send capture data to the tab
            chrome.tabs.sendMessage(crop_tab.id, {
                request: "CROP",
                source_url: active_tab.url,
                ss_data: capture,
            });
        }
    });
}
