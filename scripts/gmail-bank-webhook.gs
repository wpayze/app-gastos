const SOURCE_LABEL = "bac-compras";
const SENT_LABEL = "bac-registrado";

function processBankEmails() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty("WEBHOOK_URL");
  const secret = props.getProperty("WEBHOOK_SECRET");
  if (!GmailApp.getUserLabelByName(SOURCE_LABEL)) {
    throw new Error("Falta la etiqueta " + SOURCE_LABEL);
  }
  const sent = GmailApp.getUserLabelByName(SENT_LABEL) || GmailApp.createLabel(SENT_LABEL);

  // Una sola búsqueda: solo hilos pendientes de enviar y de la última semana.
  const query = "label:" + SOURCE_LABEL + " -label:" + SENT_LABEL + " newer_than:7d";
  GmailApp.search(query, 0, 50).forEach((thread) => {
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
 * Correos "BAC Credomatic Informa" (notificacion_hn@baccredomatic.com). En el
 * texto plano, comercio y monto van en líneas consecutivas tras sus etiquetas:
 *
 *   Comercio / Monto / WWW.AMAZON / EUR 43.46 / Horario / 2026/10/21-15:58:13
 *
 * Devuelve { message_id, importe, moneda, comercio, fecha (yyyy-mm-dd), asunto }
 * o null si el correo no es una compra aprobada que sepamos leer.
 */
const CURRENCY_MAP = { EUR: "EUR", USD: "USD", HNL: "HNL", LPS: "HNL", L: "HNL" };

function parsePurchase(message) {
  const body = message.getPlainBody();
  if (!/Aprobada/i.test(body)) return null;

  const detail = body.match(/Comercio\s*\n\s*Monto\s*\n\s*([^\n]+)\n\s*([A-Za-z]{1,3})\s+([\d.,]+)/);
  const when = body.match(/(\d{4})\/(\d{2})\/(\d{2})-\d{2}:\d{2}/);
  if (!detail || !when) return null;

  const moneda = CURRENCY_MAP[detail[2].toUpperCase()];
  if (!moneda) {
    console.warn("Moneda no soportada: " + detail[2] + " (" + message.getId() + ")");
    return null;
  }

  const card = body.match(/(MASTERCARD|VISA)\s+(\d{4})/i);
  const kind = body.match(/Tipo de compra\s*\n\s*Estado\s*\n\s*([^\n]+)/);

  return {
    message_id: message.getId(),
    importe: Number(detail[3].replace(/,/g, "")),
    moneda: moneda,
    comercio: detail[1].trim(),
    fecha: when[1] + "-" + when[2] + "-" + when[3],
    asunto: [card && card[1] + " " + card[2], kind && kind[1].trim()].filter(Boolean).join(" · "),
  };
}
