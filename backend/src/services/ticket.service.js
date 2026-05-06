import Anthropic from '@anthropic-ai/sdk'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const PROMPT = `Sos un asistente especializado en extraer datos de tickets de combustible latinoamericanos.
Analizá la imagen y extraé los siguientes campos.
Respondé ÚNICAMENTE con un objeto JSON válido (sin markdown, sin explicaciones extra), con esta estructura exacta:
{
  "fecha": "YYYY-MM-DD",
  "litros": 45.20,
  "tipo_combustible": "Gasoil",
  "proveedor": "Nombre de la estación",
  "costo_litro": 85.50,
  "costo_total": 3864.60
}
Reglas:
- fecha: formato ISO YYYY-MM-DD, o null si no se encuentra
- litros: número decimal, o null
- tipo_combustible: exactamente uno de ["Gasoil","Nafta","Nafta Premium","GNC"], o null
- proveedor: nombre de la estación/empresa, o null
- costo_litro: precio por litro como número, o null
- costo_total: importe total como número, o null
Si un campo no se puede determinar con certeza, usá null.`

export const doScanTicket = async (buffer, mimetype) => {
  if (!ALLOWED_MIME.includes(mimetype)) {
    const err = new Error('Tipo de archivo no permitido. Use JPG, PNG o WEBP.')
    err.code = 400
    throw err
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('Función de escaneo no configurada (ANTHROPIC_API_KEY ausente)')
    err.code = 503
    throw err
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const base64 = buffer.toString('base64')

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimetype, data: base64 } },
        { type: 'text', text: PROMPT },
      ],
    }],
  })

  const raw = msg.content[0]?.text?.trim() ?? ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) {
    const err = new Error('No se pudo interpretar la respuesta del modelo')
    err.code = 422
    throw err
  }

  return JSON.parse(match[0])
}
