import { prisma } from "@/lib/prisma";

// Envoi push navigateur (mentions, réponses, expertise).
// Silencieux si clés absentes ou abonnement expiré (410 → purge).
export async function sendPushToDoctors(
  doctorIds: string[],
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  const ids = Array.from(new Set((doctorIds || []).map(String))).filter(Boolean);
  if (ids.length === 0) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  let subs: any[] = [];
  try {
    const all = await (prisma as any).pushSubscription.findMany({});
    subs = (all || []).filter((s: any) => ids.includes(String(s.doctorId)));
  } catch {
    return;
  }
  if (subs.length === 0) return;
  let webpush: any = null;
  try {
    webpush = (await import("web-push")) as any;
    const wp = webpush.default || webpush;
    wp.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:contact@doctorz.dz",
      pub,
      priv
    );
    await Promise.all(
      subs.map(async (s: any) => {
        try {
          await wp.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload)
          );
        } catch (err: any) {
          // 410/404 = abonnement mort → purge.
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            try {
              await (prisma as any).pushSubscription.delete({ where: { id: s.id } });
            } catch {
              // ignore
            }
          }
        }
      })
    );
  } catch {
    // web-push indisponible : on ignore
  }
}
