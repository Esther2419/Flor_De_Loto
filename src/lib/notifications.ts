/**
 * Sistema de Notificaciones Internas (Navegador Push / Supabase Realtime)
 * Las notificaciones a servicios externos (Telegram / WhatsApp) han sido removidas.
 */

export async function notificarNuevoPedido() {
  // Las notificaciones son gestionadas en tiempo real directamente por el navegador (Web Push API)
  return Promise.resolve();
}
