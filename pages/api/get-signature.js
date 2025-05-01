import crypto from "crypto";

export default function handler(req, res) {
	const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;
	
	const token = crypto.randomBytes(16).toString("hex");
	const expire = Math.floor(Date.now() / 1000) + 60 * 5;
	
	const signature = crypto
		.createHash("sha1")
		.update(token + expire + PRIVATE_API_KEY)
		.digest("hex");
	
	res.status(200).json({ token, expire, signature });
}