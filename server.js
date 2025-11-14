const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'odequadro_secret_key_2025';

// Middleware para arquivos estáticos
app.use(express.static('.'));

// Middleware para parsing de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===== BANCO DE DADOS EM MEMÓRIA =====
let users = [
  {
    id: 1,
    cpf: '12345678901',
    nome: 'Admin Sistema',
    email: 'admin@odequadro.com',
    senha: bcrypt.hashSync('123456', 10),
    role: 'dp',
    setor: 'Departamento Pessoal',
    created_at: new Date()
  },
  {
    id: 2,
    cpf: '98765432101',
    nome: 'Gestor Teste',
    email: 'gestor@odequadro.com',
    senha: bcrypt.hashSync('123456', 10),
    role: 'gestor',
    setor: 'Facilities',
    created_at: new Date()
  }
];

let tickets = [
  {
    id: 1,
    numero: 'ODQ001',
    solicitante_id: 2,
    solicitante_nome: 'Gestor Teste',
    categoria: 'ponto',
    prioridade: 'media',
    assunto: 'Correção no ponto eletrônico',
    descricao: 'Preciso corrigir o horário de entrada do dia 10/11/2025',
    status: 'aberto',
    setor: 'Facilities',
    resposta: null,
    assigned_id: 1,
    assigned_nome: 'Admin Sistema',
    created_at: new Date('2025-11-10T08:30:00'),
    updated_at: new Date('2025-11-10T08:30:00'),
    comments: []
  }
];

let ticketCounter = 2;

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// ===== HELPER FUNCTIONS =====
function generateTicketNumber() {
  const num = String(ticketCounter).padStart(3, '0');
  return `ODQ${num}`;
}

function getUserById(id) {
  return users.find(user => user.id === parseInt(id));
}

function getUserByCPF(cpf) {
  return users.find(user => user.cpf === cpf.replace(/\D/g, ''));
}

// ===== ROTAS ESTÁTICAS =====
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

app.get('/tickets', (req, res) => {
  res.sendFile(path.join(__dirname, 'tickets.html'));
});

// Rotas de artigos
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

// ===== ROTAS DA API DE TICKETS =====

// Teste de conectividade
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString() 
  });
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { cpf, senha, role } = req.body;
    
    if (!cpf || !senha || !role) {
      return res.status(400).json({ error: 'CPF, senha e tipo de usuário são obrigatórios' });
    }
    
    const cleanCPF = cpf.replace(/\D/g, '');
    const user = getUserByCPF(cleanCPF);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado', 
        needsRegistration: true 
      });
    }
    
    if (user.role !== role) {
      return res.status(401).json({ error: 'Tipo de usuário incorreto' });
    }
    
    const validPassword = await bcrypt.compare(senha, user.senha);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    const token = jwt.sign(
      { 
        id: user.id, 
        cpf: user.cpf, 
        role: user.role,
        nome: user.nome 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    const { senha: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registro/Cadastro
app.post('/api/register', async (req, res) => {
  try {
    const { cpf, nome, email, senha, role, setor } = req.body;
    
    if (!cpf || !nome || !email || !senha || !role || !setor) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      return res.status(400).json({ error: 'CPF deve ter 11 dígitos' });
    }
    
    const existingUser = getUserByCPF(cleanCPF);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já cadastrado' });
    }
    
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const newUser = {
      id: users.length + 1,
      cpf: cleanCPF,
      nome: nome.trim(),
      email: email.trim(),
      senha: hashedPassword,
      role,
      setor,
      created_at: new Date()
    };
    
    users.push(newUser);
    
    const { senha: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificação para reset de senha
app.post('/api/password-reset/verify', async (req, res) => {
  try {
    const { cpf, role } = req.body;
    
    const cleanCPF = cpf.replace(/\D/g, '');
    const user = getUserByCPF(cleanCPF);
    
    if (!user || user.role !== role) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const { senha: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Password reset verify error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualização de senha
app.post('/api/password-reset/update', async (req, res) => {
  try {
    const { cpf, role, newPassword } = req.body;
    
    const cleanCPF = cpf.replace(/\D/g, '');
    const userIndex = users.findIndex(u => u.cpf === cleanCPF && u.role === role);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    users[userIndex].senha = hashedPassword;
    
    res.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
    
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar tickets
app.get('/api/tickets', authenticateToken, (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;
    
    let filteredTickets = tickets;
    
    // Filtrar por role
    if (user.role === 'colaborador') {
      filteredTickets = tickets.filter(ticket => ticket.solicitante_id === user.id);
    } else if (user.role === 'gestor') {
      const userRecord = getUserById(user.id);
      if (userRecord) {
        filteredTickets = tickets.filter(ticket => ticket.setor === userRecord.setor);
      }
    }
    // DP vê todos os tickets
    
    // Filtrar por status se especificado
    if (status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    filteredTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json(filteredTickets);
    
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar ticket
app.post('/api/tickets', authenticateToken, (req, res) => {
  try {
    const { categoria, prioridade, assunto, descricao } = req.body;
    const user = req.user;
    
    if (!categoria || !prioridade || !assunto || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const userRecord = getUserById(user.id);
    if (!userRecord) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const newTicket = {
      id: tickets.length + 1,
      numero: generateTicketNumber(),
      solicitante_id: user.id,
      solicitante_nome: user.nome,
      categoria,
      prioridade,
      assunto: assunto.trim(),
      descricao: descricao.trim(),
      status: 'aberto',
      setor: userRecord.setor,
      resposta: null,
      assigned_id: null,
      assigned_nome: null,
      created_at: new Date(),
      updated_at: new Date(),
      comments: []
    };
    
    tickets.push(newTicket);
    ticketCounter++;
    
    res.status(201).json({
      success: true,
      message: 'Ticket criado com sucesso',
      ticket: newTicket
    });
    
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter ticket específico
app.get('/api/tickets/:id', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const user = req.user;
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    // Verificar permissões
    if (user.role === 'colaborador' && ticket.solicitante_id !== user.id) {
      return res.status(403).json({ error: 'Sem permissão para ver este ticket' });
    }
    
    if (user.role === 'gestor') {
      const userRecord = getUserById(user.id);
      if (userRecord && ticket.setor !== userRecord.setor) {
        return res.status(403).json({ error: 'Sem permissão para ver este ticket' });
      }
    }
    
    res.json(ticket);
    
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status do ticket
app.put('/api/tickets/:id/status', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    const user = req.user;
    
    if (!['aberto', 'em-andamento', 'resolvido'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    // Apenas DP e gestores podem alterar status
    if (user.role === 'colaborador') {
      return res.status(403).json({ error: 'Sem permissão para alterar status' });
    }
    
    tickets[ticketIndex].status = status;
    tickets[ticketIndex].updated_at = new Date();
    
    if (!tickets[ticketIndex].assigned_id && (user.role === 'dp' || user.role === 'gestor')) {
      tickets[ticketIndex].assigned_id = user.id;
      tickets[ticketIndex].assigned_nome = user.nome;
    }
    
    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      ticket: tickets[ticketIndex]
    });
    
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar comentário ao ticket
app.post('/api/tickets/:id/comments', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { comentario } = req.body;
    const user = req.user;
    
    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ error: 'Comentário é obrigatório' });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    const newComment = {
      id: Date.now(),
      autor_id: user.id,
      autor_nome: user.nome,
      comentario: comentario.trim(),
      created_at: new Date()
    };
    
    tickets[ticketIndex].comments.push(newComment);
    tickets[ticketIndex].updated_at = new Date();
    
    res.status(201).json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      comment: newComment
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas do dashboard
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    
    let relevantTickets = tickets;
    
    // Filtrar tickets baseado no role
    if (user.role === 'colaborador') {
      relevantTickets = tickets.filter(ticket => ticket.solicitante_id === user.id);
    } else if (user.role === 'gestor') {
      const userRecord = getUserById(user.id);
      if (userRecord) {
        relevantTickets = tickets.filter(ticket => ticket.setor === userRecord.setor);
      }
    }
    
    const stats = {
      total: relevantTickets.length,
      abertos: relevantTickets.filter(t => t.status === 'aberto').length,
      andamento: relevantTickets.filter(t => t.status === 'em-andamento').length,
      resolvidos: relevantTickets.filter(t => t.status === 'resolvido').length
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Exportar tickets (apenas para DP e gestores)
app.get('/api/tickets/export', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'colaborador') {
      return res.status(403).json({ error: 'Sem permissão para exportar' });
    }
    
    let relevantTickets = tickets;
    
    if (user.role === 'gestor') {
      const userRecord = getUserById(user.id);
      if (userRecord) {
        relevantTickets = tickets.filter(ticket => ticket.setor === userRecord.setor);
      }
    }
    
    // Gerar CSV
    const csvHeaders = 'ID,Número,Solicitante,Categoria,Prioridade,Assunto,Status,Setor,Data Criação\n';
    const csvData = relevantTickets.map(ticket => {
      return `${ticket.id},${ticket.numero},"${ticket.solicitante_nome}","${ticket.categoria}","${ticket.prioridade}","${ticket.assunto}","${ticket.status}","${ticket.setor}","${new Date(ticket.created_at).toLocaleDateString('pt-BR')}"`;
    }).join('\n');
    
    const csv = csvHeaders + csvData;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
    res.send('\ufeff' + csv); // BOM para UTF-8
    
  } catch (error) {
    console.error('Export tickets error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS ORIGINAIS =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.length,
    tickets: tickets.length
  });
});

// API para contato (Formspree alternativo)
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

// Start server - Railway must use 0.0.0.0
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📊 Usuários cadastrados: ${users.length}`);
  console.log(`🎫 Tickets no sistema: ${tickets.length}`);
  console.log('📝 Credenciais de teste:');
  console.log('   Admin DP: CPF 12345678901, Senha: 123456');
  console.log('   Gestor: CPF 98765432101, Senha: 123456');
});