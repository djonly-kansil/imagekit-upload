import crypto from "crypto";
import admin from "firebase-admin";

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert({
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
		}),
	});
}

export default async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	
	if (req.method === "OPTIONS") return res.status(200).end();
	if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
	
	const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;
	const PUBLIC_API_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
	
	if (!PRIVATE_API_KEY || !PUBLIC_API_KEY) {
		return res.status(500).json({ error: "PRIVATE_API_KEY atau IMAGEKIT_PUBLIC_KEY belum diatur" });
	}
	
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Token otorisasi tidak ditemukan" });
	}
	
	const idToken = authHeader.split(" ")[1];
	
	try {
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		const uid = decodedToken.uid;
		
		const userDoc = await admin.firestore().collection("users").doc(uid).get();
		const role = userDoc.data()?.role;
		
		if (!userDoc.exists() || !["admin", "editor"].includes(role)) {
			return res.status(403).json({ error: "Akses ditolak. Hanya admin/editor yang diizinkan." });
		}
		
		const token = crypto.randomUUID();
		const expire = Math.floor(Date.now() / 1000) + 60 * 5;
		
		const signature = crypto
			.createHmac("sha1", PRIVATE_API_KEY)
			.update(token + expire)
			.digest("hex");
		
		return res.status(200).json({ token, expire, signature, publicKey: PUBLIC_API_KEY });
	} catch (error) {
		console.error("Auth Error:", error);
		return res.status(401).json({ error: "Token tidak valid atau kadaluarsa" });
	}
}