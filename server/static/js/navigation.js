import * as editor from "./editor/editor.js";
import { Screenshot } from "./editor/models.js";
export async function init() {
    window.addEventListener("popstate", updateApp);
    const path = window.location.pathname.substring(1);
    if (!path) {
        const hash_vars = await parseUrlHash();
        if ("img_data" in hash_vars && hash_vars.img_data instanceof Blob) {
            navigateToScreenshot(await Screenshot.create(hash_vars.img_data, hash_vars.source_url));
            return;
        }
        document.body.classList.add("home");
        return;
    }
    const image_id_re = new RegExp("^[a-z2-7]{13}$");
    if (!image_id_re.test(path)) {
        console.log("Path name is not a valid image id.");
        window.location.pathname = "/404";
    }
    console.log("loading image", path);
    const ss = await Screenshot.get(path);
    if (!ss.image_id) {
        window.location.pathname = "/404";
    }
    editor.setupScreenshot(ss);
    document.body.classList.add("editing");
}
function updateApp(evt) {
    if ((window.location.pathname = "/")) {
        document.body.classList.remove("editing");
        document.body.classList.add("home");
    }
}
export function navigateToScreenshot(ss) {
    editor.setupScreenshot(ss);
    window.history.pushState({}, "", ss.url);
    document.body.classList.remove("home");
    document.body.classList.add("editing");
}
async function parseUrlHash() {
    const hash = window.location.hash.substring(1);
    const hash_vars = {};
    if (hash) {
        window.location.hash = "";
        for (let varg of hash.split("&")) {
            let [key, val] = varg.split("=");
            if (key && val) {
                if (val.startsWith("data:")) {
                    hash_vars[key] = await fetch(val).then((r) => r.blob());
                }
                else {
                    hash_vars[key] = decodeURIComponent(val);
                }
            }
        }
    }
    return hash_vars;
}
