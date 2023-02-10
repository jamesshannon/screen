/** @fileoverview Screenshot model, including relevant API calls. */

import { Annotation } from "../annotations/annotations_base";

/** @var Fields that will be output to or parsed from JSON. */
// Module-level because they're needed by both static and instance
// methods.
const auto_fields = [
  "image_id",
  "source_url",
  "user_id",
  "annotations",
  "status",
  "created",
  "updated",
];

/** @class Screenshot class, including saving to server */
export class Screenshot {
  /** @property Screenshot ID (image id on the server) */
  image_id: string = "";
  /** @property URL of page screenshot was taken from. Will often be empty. */
  source_url: string = "";
  /** @property User ID of the screenshot creator. */
  user_id: string = "";
  /** @property Array of Annotations (instances or tuples) */
  // When we get from the API we get a JSON tuple representation. Before saving
  // to API we have the actual class instances which JSON converts into the
  // tuple. It should be consistent but Annotation instances are really "heavy"
  // and we need a lot to instantiate them (e.g., a DOM element)
  annotations: Array<Annotation | [string, any]> = [];
  /** @property Screenshot status. Currently always PUBLIC */
  status: string = "";
  /** @property Time that the screenshot was created, unix timestamp seconds */
  created: number = 0;
  /** @property Time that the screenshot was edited, unix timestamp seconds */
  updated: number = 0;

  /** @property The data URL if the image is stored "locally" */
  // This is only used on creation, so that the editor can use the local file
  // just as if it were using a file from the server
  private data_img_url?: string;

  /** @property URL for the screenshot image */
  get image_url(): string {
    return this.data_img_url ? this.data_img_url : `/i/${this.image_id}.png`;
  }

  set image_url(data_img_url: string) {
    this.data_img_url = data_img_url;
  }

  /** @property Web URL for this screenshot (editor experience) */
  get url(): string {
    return `/${this.image_id}`;
  }

  /**
   * @method Create a new `Screenshot` on the server (POST).
   *     Only accepts the file blob and an optional URL string, not a
   *     `Screenshot` instance, since we require those to be set up before
   *     editing begins.
   */
  static async create(
    img_file: Blob,
    source_url?: string
  ): Promise<Screenshot> {
    // Create the form to upload the data
    const data = new FormData();
    data.append("img", img_file);
    if (source_url) {
      data.append("source_url", source_url);
    }

    // POST the image (and possible URL). The API will return the new
    // `Screenshot` in JSON, so return a parsed version of that object and
    // override image with the local `data:`
    return this.parse(
      fetch("/api/v1/images/", {
        method: "POST",
        body: data,
      }),
      window.URL.createObjectURL(img_file)
    );
  }

  /** @method Save the `Screenshot` changes to the server (PUT). */
  async save() {
    console.log("Saving screenshot", this);

    fetch(`/api/v1/images/${this.image_id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(this),
    });
  }

  /** @mmethod GET `Screenshot` from server based on ID */
  static async get(image_id: string): Promise<Screenshot> {
    return this.parse(fetch(`/api/v1/images/${image_id}`));
  }

  /** @method Create a JSON object with only the allowlisted properties. */
  toJSON(): any {
    const json_obj = {};
    for (let field of auto_fields) {
      json_obj[field] = this[field];
    }
    return json_obj;
  }

  /**
   * @method Parse a JSON (promised) screenshot object into a `Screenshot`
   * @param data_image_url Override the `Screenshot.image_url` property with
   *     a local URL so that the editor doesn't immediately re-download.
   * */
  private static async parse(
    request: Promise<Response>,
    data_image_url?: string
  ): Promise<Screenshot> {
    const ss_obj = await request.then((r) => r.json());
    const ss = new Screenshot();

    for (let key of auto_fields) {
      ss[key] = ss_obj[key];
    }

    if (data_image_url) {
      ss.image_url = data_image_url;
    }

    return ss;
  }
}
