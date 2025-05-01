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
	
	console.log("ENV CHECK:");
	console.log("IMAGEKIT_PUBLIC_KEY:", process.env.IMAGEKIT_PUBLIC_KEY);
	console.log("IMAGEKIT_PRIVATE_KEY:", process.env.IMAGEKIT_PRIVATE_KEY ? "OK" : "MISSING");
	console.log("IMAGEKIT_URL_ENDPOINT:", process.env.IMAGEKIT_URL_ENDPOINT);
	
	try {
		const imagekit = new ImageKit({
			publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
			privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
			urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
		});
		
		const result = imagekit.getAuthenticationParameters();
		res.status(200).json(result);
	} catch (err) {
		console.error("ImageKit Auth Error:", err);
		res.status(500).json({ error: "Internal Server Error" });
	}
};