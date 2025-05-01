import crypto from "crypto";

export default function handler(req, res) {
	// Izinkan permintaan dari semua origin (CORS)
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	
	// Tangani preflight (OPTIONS) request
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}
	
	const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;
	if (!PRIVATE_API_KEY) {
		return res.status(500).json({ error: "PRIVATE_API_KEY belum diatur" });
	}
	
	const token = crypto.randomBytes(16).toString("hex");
	const expire = Math.floor(Date.now() / 1000) + 60 * 5;
	
	const signature = crypto
		.createHash("sha1")
		.update(token + expire + PRIVATE_API_KEY)
		.digest("hex");
	
	res.status(200).json({ token, expire, signature });
}