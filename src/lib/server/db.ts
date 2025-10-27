import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import {
	DB_HOST,
	DB_PORT,
	DB_USER,
	DB_PASS,
	DB_NAME,
	DB_SSL,
	DB_CA_CERT
} from '$env/static/private';

function readCaFromEnvOrFile(): string | undefined {
	const v = DB_CA_CERT;
	if (!v) return undefined;

	if (v.includes('BEGIN CERTIFICATE')) return v.replace(/\\n/g, '\n'); // inline PEM
	const abs = path.resolve(process.cwd(), v); // file path
	if (fs.existsSync(abs)) return fs.readFileSync(abs, 'utf8');
	return undefined;
}

const useSSL = String(DB_SSL ?? '').toLowerCase() === 'true';
const ca = useSSL ? readCaFromEnvOrFile() : undefined;

export const pool = mysql.createPool({
	host: DB_HOST!,
	port: Number(DB_PORT ?? 3306),
	user: DB_USER!,
	password: DB_PASS!,
	database: DB_NAME!,
	waitForConnections: true,
	connectionLimit: 10,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,
	namedPlaceholders: false,
	ssl: useSSL ? { ca, minVersion: 'TLSv1.2' as const } : undefined
});

export async function q<T = any>(sql: string, params: any[] = []) {
	try {
		const [rows] = await pool.execute(sql, params);
		return rows as T;
	} catch (err: any) {
		console.error('DB ERROR:', err?.code ?? err?.message ?? err);
		throw err;
	}
}
