import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const termo = req.query.q;
  if (!termo) return res.status(400).json({ error: 'Falta ?q=' });

  try {
    const url = `https://fillusveiculos.com.br/estoque?termo=${encodeURIComponent(termo)}`;
    const response = await fetch(url);
    const html = await response.text();

    // Verifica se há veículos
    const hasResults = html.includes("veículo encontrado") || html.includes("veículos encontrados");

    if (!hasResults) {
      return res.json({
        found: false,
        message: `Desculpe, não temos "${termo}" em estoque no momento.`
      });
    }

    // Extrai as linhas de texto
    const lines = html.split('\n').map(l => l.trim()).filter(Boolean);
    const idx = lines.findIndex(l => l.includes("veículo encontrado"));

    let marca = '', modelo = '', versao = '', ano = '', km = '';
    if (idx !== -1) {
      marca = lines[idx + 1] || '';
      modelo = lines[idx + 2] || '';
      versao = lines[idx + 3] || '';
      ano = lines[idx + 4] || '';
      km = lines[idx + 5] || '';
    }

    res.json({
      found: true,
      marca,
      modelo,
      versao,
      ano,
      km,
      message: `Temos um veículo compatível com "${termo}"! Um consultor entrará em contato com fotos e preço.`
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao consultar estoque.' });
  }
}
