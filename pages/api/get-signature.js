import crypto from "crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { auth } from "../../lib/firebaseAdmin";

const app = !global._firebaseApp ? initializeApp({
	credential: cert({
		projectId: process.env.FIREBASE_PROJECT_ID,
		clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
		privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
	}),
}) : global._firebaseApp;

global._firebaseApp = app;

export default async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}
	
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Token tidak ditemukan" });
	}
	
	const idToken = authHeader.split("Bearer ")[1];
	
	try {
		const decoded = await auth().verifyIdToken(idToken);
		const { uid } = decoded;
		
		// Di sini kamu bisa cek Firestore atau custom claims
		const userDoc = await fetch(`https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`);
		const userData = await userDoc.json();
		
		const role = userData.fields?.role?.stringValue;
		if (!["admin", "editor"].includes(role)) {
			return res.status(403).json({ error: "Akses ditolak. Role tidak valid." });
		}
		
		// Signature generation (ImageKit)
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
		console.error(err);
		return res.status(401).json({ error: "Token tidak valid atau server error" });
	}
}