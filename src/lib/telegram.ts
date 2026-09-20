import https from 'https';

export async function notificarPedidoTelegram(pedido: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('Faltan credenciales de Telegram en .env');
    return;
  }

  const urlBase = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const urlPanel = `${urlBase}/admin/pedidos`;

  const texto = `🌸 *¡NUEVO PEDIDO RECIBIDO!* 🌸\n\n` +
    `📦 *Pedido #:* ${pedido.id}\n` +
    `👤 *Cliente:* ${pedido.nombre_contacto || 'Cliente'}\n` +
    `📞 *Teléfono:* ${pedido.telefono_contacto || 'Sin teléfono'}\n` +
    `💰 *Total:* Bs. ${pedido.total_pagar || pedido.total || '0.00'}\n\n` +
    `⚠️ *ATENCIÓN:* Tienes *${pedido.pendientes}* pedido(s) pendiente(s).\n\n` +
    `👉 [Revisa tu panel de administración aquí](${urlPanel})`;

  const payload = JSON.stringify({
    chat_id: chatId,
    text: texto,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    family: 4, // <-- FORZAR IPv4 para evitar ETIMEDOUT en Windows
    timeout: 10000 // 10 segundos máximo
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Respuesta de Telegram:', data);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('Error al enviar alerta a Telegram:', err.message);
      resolve(null); // No rompemos el flujo del pedido si falla la red
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Timeout al contactar con Telegram');
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}