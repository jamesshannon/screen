const auto_fields = [
    "image_id",
    "source_url",
    "user_id",
    "annotations",
    "status",
    "created",
    "updated",
];
export class Screenshot {
    constructor() {
        this.image_id = "";
        this.source_url = "";
        this.user_id = "";
        this.annotations = [];
        this.status = "";
        this.created = 0;
        this.updated = 0;
    }
    get image_url() {
        return this.data_img_url ? this.data_img_url : `/i/${this.image_id}.png`;
    }
    set image_url(data_img_url) {
        this.data_img_url = data_img_url;
    }
    get url() {
        return `/${this.image_id}`;
    }
    static async create(img_file, source_url) {
        const data = new FormData();
        data.append("img", img_file);
        if (source_url) {
            data.append("source_url", source_url);
        }
        return this.parse(fetch("/api/v1/images/", {
            method: "POST",
            body: data,
        }), window.URL.createObjectURL(img_file));
    }
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
    static async get(image_id) {
        return this.parse(fetch(`/api/v1/images/${image_id}`));
    }
    toJSON() {
        const json_obj = {};
        for (let field of auto_fields) {
            json_obj[field] = this[field];
        }
        return json_obj;
    }
    static async parse(request, data_image_url) {
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
