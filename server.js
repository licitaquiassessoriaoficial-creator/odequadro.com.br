const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// CORS para desenvolvimento
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rotas para páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/quem-somos', (req, res) => {
  res.sendFile(path.join(__dirname, 'quem-somos.html'));
});

app.get('/servicos', (req, res) => {
  res.sendFile(path.join(__dirname, 'servicos.html'));
});

app.get('/contato', (req, res) => {
  res.sendFile(path.join(__dirname, 'contato.html'));
});

app.get('/segmentos', (req, res) => {
  res.sendFile(path.join(__dirname, 'segmentos.html'));
});

app.get('/solucoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'solucoes.html'));
});

app.get('/incorporadora', (req, res) => {
  res.sendFile(path.join(__dirname, 'incorporadora.html'));
});

app.get('/construcao', (req, res) => {
  res.sendFile(path.join(__dirname, 'construcao.html'));
});

app.get('/facilities', (req, res) => {
  res.sendFile(path.join(__dirname, 'facilities.html'));
});

app.get('/licitacoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'licitacoes.html'));
});

app.get('/recursos-humanos', (req, res) => {
  res.sendFile(path.join(__dirname, 'recursos-humanos.html'));
});

app.get('/certificacoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'certificacoes.html'));
});

app.get('/noticias', (req, res) => {
  res.sendFile(path.join(__dirname, 'noticias.html'));
});

app.get('/obrigado', (req, res) => {
  res.sendFile(path.join(__dirname, 'obrigado.html'));
});

// Rotas para artigos
app.get('/artigo-campinas-imoveis', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-campinas-imoveis.html'));
});

app.get('/artigo-certificacoes-iso', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-certificacoes-iso.html'));
});

app.get('/artigo-facilities-2024', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-facilities-2024.html'));
});

app.get('/artigo-guia-comprador-imoveis', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-guia-comprador-imoveis.html'));
});

app.get('/artigo-licitacoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-licitacoes.html'));
});

app.get('/artigo-rh-especializados', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-rh-especializados.html'));
});

app.get('/artigo-sustentabilidade-construcao', (req, res) => {
  res.sendFile(path.join(__dirname, 'artigo-sustentabilidade-construcao.html'));
});

// API de teste
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: '0.0.0.0'
  });
});

// API para contato (simulada)
app.post('/api/contato', (req, res) => {
  const { nome, email, telefone, mensagem } = req.body;
  
  console.log('Contato recebido:', { nome, email, telefone, mensagem });
  
  res.json({
    success: true,
    message: 'Mensagem enviada com sucesso!',
    data: { nome, email, telefone, mensagem }
  });
});

// Middleware de tratamento de erro
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// 404 - Redireciona para home
app.use('*', (req, res) => {
  res.redirect('/');
});

// Iniciar servidor - Railway precisa de 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Host: 0.0.0.0:${PORT}`);
  console.log(`✅ Railway ready!`);
  console.log(`📝 API endpoints:`);
  console.log(`   GET /api/health`);
  console.log(`   POST /api/contato`);
});

module.exports = app;