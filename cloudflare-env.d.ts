/**
 * `@opennextjs/cloudflare` ning `getCloudflareContext()` funksiyasi
 * `CloudflareEnv` nomli global interfeysni kutadi, `wrangler types` esa
 * bindinglarni `Cloudflare.Env` ichiga yozadi. Bu fayl ikkalasini bog'laydi.
 *
 * wrangler.jsonc o'zgargach tiplarni yangilang:  npm run cf:types
 */
declare global {
  interface CloudflareEnv extends Cloudflare.Env {}
}

export {};
