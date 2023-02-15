import * as uploadHandlers from "./upload_handlers.js";
import * as editor from "./editor/editor.js";
import * as navigation from "./navigation.js";
(function init() {
    uploadHandlers.init();
    editor.init();
    navigation.init();
})();
