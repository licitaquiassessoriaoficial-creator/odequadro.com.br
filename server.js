const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());
app.use(express.static('.'));

// Rota principal para servir o HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rotas para outras páginas
app.get('/quem-somos', (req, res) => {
  res.sendFile(path.join(__dirname, 'quem-somos.html'));
});

app.get('/servicos', (req, res) => {
  res.sendFile(path.join(__dirname, 'servicos.html'));
});

app.get('/contato', (req, res) => {
  res.sendFile(path.join(__dirname, 'contato.html'));
});

// Rota de teste da API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando!', 
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});

module.exports = app;