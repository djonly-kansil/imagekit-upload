import { ImageKit } from "imagekit";

export default function handler(req, res) {
    const imagekit = new ImageKit({
        publicKey: "public_cai3Ahsub6oj/v9ZKtEPJAoD+kw=",
        privateKey: "private_cksQeyrCwKqskK5nxo548Gd/d9M=",
        urlEndpoint: "https://ik.imagekit.io/your_imagekit_id"
    });

    const result = imagekit.getAuthenticationParameters();
    res.status(200).json(result);
}