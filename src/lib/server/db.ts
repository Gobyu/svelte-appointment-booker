import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';


function getCaFromEnv(): string | undefined {
	const b64 = env.DB_CA_B64;
	if (b64 && b64.trim().length) {
		try {
			return Buffer.from(b64.trim(), 'base64').toString('utf8');
		} catch {
		}
	}
	const pem = env.DB_CA_CERT;
	if (pem && pem.includes('BEGIN CERTIFICATE')) {
		return pem.replace(/\\n/g, '\n');
	}
	return undefined;
}

const useSSL = String(env.DB_SSL ?? 'true').toLowerCase() !== 'false';
const ca = useSSL ? getCaFromEnv() : undefined;

export const pool = mysql.createPool({
	host: env.DB_HOST!,
	port: Number(env.DB_PORT ?? 3306),
	user: env.DB_USER!,
	password: env.DB_PASS!,
	database: env.DB_NAME!,
	waitForConnections: true,
	connectionLimit: 10,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0,
	namedPlaceholders: false,
	ssl: useSSL
		? (ca
				? { ca, minVersion: 'TLSv1.2', rejectUnauthorized: true }
				: { minVersion: 'TLSv1.2', rejectUnauthorized: true })
		: undefined
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
