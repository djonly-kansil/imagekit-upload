// pages/api/get-signature.js
import crypto from "crypto";
import { auth, db } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	
	if (req.method === "OPTIONS") return res.status(200).end();
	
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Token tidak ditemukan" });
	}
	
	const idToken = authHeader.split("Bearer ")[1];
	
	try {
		const decoded = await auth.verifyIdToken(idToken);
		const { uid } = decoded;
		
		// Cek role via Firestore Admin SDK (bukan REST API)
		const userSnap = await db.doc(`users/${uid}`).get();
		const role = userSnap.exists ? userSnap.data().role : undefined;
		
		console.log("User UID:", uid);
		console.log("Role ditemukan:", role);
		
		if (!["admin", "editor"].includes(role)) {
			return res.status(403).json({ error: "Akses ditolak. Role tidak valid." });
		}
		
		// Generate ImageKit signature
		const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;
		const PUBLIC_API_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
		const token = crypto.randomUUID();
		const expire = Math.floor(Date.now() / 1000) + 60 * 5;
		
		const signature = crypto
			.createHmac("sha1", PRIVATE_API_KEY)
			.update(token + expire)
			.digest("hex");
		
		return res.status(200).json({
			token,
			expire,
			signature,
			publicKey: PUBLIC_API_KEY,
		});
	} catch (err) {
		console.error("Kesalahan saat verifikasi token atau akses Firestore:", err);
		return res.status(401).json({ error: "Token tidak valid atau server error" });
	}
}