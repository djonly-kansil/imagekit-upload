import  ImageKit  from "imagekit";

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");

    const imagekit = new ImageKit({
        publicKey: "public_cai3Ahsub6oj/v9ZKtEPJAoD+kw=",
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: "https://ik.imagekit.io/taloarane"
    });

    const result = imagekit.getAuthenticationParameters();
    res.status(200).json(result);
}