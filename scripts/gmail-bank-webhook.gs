/**
 * Google Apps Script: envía a la app cada compra que llega por correo del banco.
 *
 * Instalación:
 *  1. script.google.com → Nuevo proyecto → pega este archivo.
 *  2. Configuración del proyecto → Propiedades del script: WEBHOOK_URL
 *     (https://TU-DOMINIO/api/webhooks/bank-email) y WEBHOOK_SECRET (el mismo
 *     valor que BANK_WEBHOOK_SECRET en la app).
 *  3. En Gmail crea una etiqueta "banco-compras" y un filtro que la aplique a
 *     los correos de compra del banco.
 *  4. Activadores → añadir activador: processBankEmails, basado en tiempo, cada 5 min.
 *
 * Los mensajes ya enviados se marcan con la etiqueta "banco-enviado"; además
 * la app ignora duplicados por message_id, así que reintentar es seguro.
 */

const SOURCE_LABEL = "banco-compras";
const SENT_LABEL = "banco-enviado";

function processBankEmails() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty("WEBHOOK_URL");
  const secret = props.getProperty("WEBHOOK_SECRET");
  const source = GmailApp.getUserLabelByName(SOURCE_LABEL);
  if (!source) throw new Error("Falta la etiqueta " + SOURCE_LABEL);
  const sent = GmailApp.getUserLabelByName(SENT_LABEL) || GmailApp.createLabel(SENT_LABEL);

  source.getThreads(0, 50).forEach((thread) => {
    if (thread.getLabels().some((l) => l.getName() === SENT_LABEL)) return;
    let allOk = true;
    thread.getMessages().forEach((message) => {
      const purchase = parsePurchase(message);
      if (!purchase) return;
      const res = UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + secret },
        payload: JSON.stringify(purchase),
        muteHttpExceptions: true,
      });
      if (res.getResponseCode() !== 200) {
        allOk = false;
        console.error(res.getResponseCode() + " " + res.getContentText());
      }
    });
    if (allOk) thread.addLabel(sent);
  });
}

/**
 * AJUSTAR al formato real del correo del banco. Debe devolver
 * { message_id, importe, moneda, comercio, fecha (yyyy-mm-dd), asunto } o null.
 */
function parsePurchase(message) {
  const body = message.getPlainBody();
  const amount = body.match(/(\d+(?:[.,]\d{1,2})?)\s*(EUR|€|USD|\$)/i);
  const merchant = body.match(/(?:en|comercio:?)\s+([^\n.]+)/i);
  if (!amount || !merchant) return null;
  const currency = /usd|\$/i.test(amount[2]) ? "USD" : "EUR";
  return {
    message_id: message.getId(),
    importe: Number(amount[1].replace(",", ".")),
    moneda: currency,
    comercio: merchant[1].trim(),
    fecha: Utilities.formatDate(message.getDate(), "Europe/Madrid", "yyyy-MM-dd"),
    asunto: message.getSubject(),
  };
}
