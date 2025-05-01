const ImageKit = require("imagekit");

module.exports = function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	
	if (req.method === "OPTIONS") {
		res.status(200).end();
		return;
	}
	
	if (req.method !== "GET") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}
	
	console.log("USING HARDCODED CREDENTIALS");
	
	try {
		const imagekit = new ImageKit({
			publicKey: "public_cai3Ahsub6oj/v9ZKtEPJAoD+kw=",
			privateKey: "private_cksQeyrCwKqskK5nxo548Gd/d9M=",
			urlEndpoint: "https://ik.imagekit.io/taloarane"
		});
		
		const result = imagekit.getAuthenticationParameters();
		res.status(200).json(result);
	} catch (err) {
		console.error("ImageKit Auth Error:", err);
		res.status(500).json({ error: "Internal Server Error" });
	}
};