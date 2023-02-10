/** Extension service worker to listen for click event and open crop page. */
chrome.action.onClicked.addListener(capture);

/** @function Handle the action button click and open crop page. */
async function capture() {
  // TODO: check if tab is
  const [active_tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  // Check if we're cropping the crop page, in which case that means "I don't
  // want to crop -- send the full screenshot".
  if (active_tab.url?.includes(chrome.runtime.id)) {
    // Tell the tab to upload the full image
    chrome.tabs.sendMessage(active_tab.id!, { request: "UPLOAD" });
  } else {
    const capture_request = chrome.tabs.captureVisibleTab({ format: "png" });

    const tab_request = chrome.tabs.create({
      url: chrome.runtime.getURL("/crop.html"),
    });

    const capture = await capture_request;
    const crop_tab = await tab_request;

    // send capture data to the tab
    chrome.tabs.sendMessage(crop_tab.id!, {
      request: "CROP",
      source_url: active_tab.url,
      ss_data: capture,
    });
  }
}
