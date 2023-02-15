/** @fileoverview Initialization and functions for navigating */
import * as editor from "./editor/editor.js";
import { Screenshot } from "./editor/models.js";

declare global {
  var user_id: string;
}

/** @function Initialize the SPA navigation module and load initial page. */
export async function init(): Promise<void> {
  window.addEventListener("popstate", updateApp);

  const path = window.location.pathname.substring(1);
  if (!path) {
    // homepage is the default page, but we may have an image in the URL,
    // "uploaded" from something else (like the chrome extension)

    // We use hash specifically because its not sent to the server
    const hash_vars = await parseUrlHash();
    if ("img_data" in hash_vars && hash_vars.img_data instanceof Blob) {
      navigateToScreenshot(
        await Screenshot.create(hash_vars.img_data, hash_vars.source_url)
      );

      return;
    }

    document.body.classList.add("home");
    return;
  }

  // The URL has a path. The only valid paths for this SPA are the home page
  // and image view, so check if this is a valid image_id format. The server
  // should have already done this.

  const image_id_re = new RegExp("^[a-z2-7]{13}$");
  if (!image_id_re.test(path)) {
    // invalid ID -- don't even bother trying to load
    console.log("Path name is not a valid image id.");
    window.location.pathname = "/404";
  }

  // Get the Screenshot instance by ID, make sure it exists, and navigate to it.

  // Currently this is only used for initial page load. This isn't a service
  // worker so other navigation situations force a new GET. Maybe not moving
  // back in the history if we had moved forward with a push()?
  console.log("loading image", path);
  const ss = await Screenshot.get(path);
  if (!ss.image_id) {
    window.location.pathname = "/404";
  }

  editor.setupScreenshot(ss);
  document.body.classList.add("editing");
}

/** @function Update the UI based on back/forward navigation. */
function updateApp(evt: PopStateEvent) {
  if ((window.location.pathname = "/")) {
    document.body.classList.remove("editing");
    document.body.classList.add("home");
  }
}

/**
 * @function "Navigate" to a specific screenshot
 * Have the editor set up the screenshot editing experience and updates the
 * URL.
 */
export function navigateToScreenshot(ss: Screenshot): void {
  // This is "navigation" in the sense that we're simulating a new page and
  // updating the URL.
  editor.setupScreenshot(ss);
  window.history.pushState({}, "", ss.url);
  document.body.classList.remove("home");
  document.body.classList.add("editing");
}

/**
 * @function Parse the URL hash value (#...) and return an object
 * This uses the typical URL parameter format (a=b&c=d).
 * Any data values (e.g., data:image/png:...) are converted to Blobs while all
 * other values are URL-decoded. Empty object returned if there is no hash.
 */
async function parseUrlHash(): Promise<any> {
  // Get the URL hash string and remove the #
  const hash = window.location.hash.substring(1);
  const hash_vars = {};

  if (hash) {
    window.location.hash = "";

    for (let varg of hash.split("&")) {
      let [key, val] = varg.split("=");
      if (key && val) {
        // do the parsing
        if (val.startsWith("data:")) {
          // this is a data URL. Convert to a blob
          hash_vars[key] = await fetch(val).then((r) => r.blob());
        } else {
          // Remove URL encoding
          hash_vars[key] = decodeURIComponent(val);
        }
      }
    }
  }

  return hash_vars;
}
