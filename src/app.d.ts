// src/app.d.ts
export {};

declare global {
	namespace App {
		interface Locals {
			user: { id: number; email: string; role: 'admin' | 'staff' | 'user' } | null;
		}
		interface PageData {
			user?: App.Locals['user'];
		}
	}
}
