const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { pool, initializeDatabase } = require('./database-mysql');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'odequadro_secret_key_2025';

// CPFs autorizados para Departamento Pessoal (DP)
const AUTHORIZED_DP_CPFS = [
  '12345678901', // Admin Sistema (teste)
  '26346512870', // Robinson - Diretor ODQ (acesso total)
  // Adicione aqui os CPFs autorizados para acessar o DP
];

// CPFs autorizados para Gestores
const AUTHORIZED_GESTOR_CPFS = [
  '98765432101', // Gestor Teste
  '26346512870', // Robinson - Diretor ODQ (acesso total)
  // Adicione aqui os CPFs dos gestores:
  // Adriano Bonfim, Clara Nave, Alexandre Marçal, Cristiane Silva
];

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
async function generateTicketNumber() {
  try {
    const [rows] = await pool.query(
      'SELECT numero FROM tickets ORDER BY id DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      return 'ODQ001';
    }
    
    const lastNumber = rows[0].numero;
    const num = parseInt(lastNumber.replace('ODQ', '')) + 1;
    return `ODQ${String(num).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating ticket number:', error);
    return 'ODQ001';
  }
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

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'faq.html'));
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
    message: 'API funcionando com MySQL no Railway!', 
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
    
    // Validar se CPF está autorizado para DP
    if (role === 'dp' && !AUTHORIZED_DP_CPFS.includes(cleanCPF)) {
      return res.status(403).json({ 
        error: 'Acesso negado. CPF não autorizado para o Departamento Pessoal.' 
      });
    }
    
    // Validar se CPF está autorizado para Gestor
    if (role === 'gestor' && !AUTHORIZED_GESTOR_CPFS.includes(cleanCPF)) {
      return res.status(403).json({ 
        error: 'Acesso negado. CPF não autorizado para acesso como Gestor.' 
      });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE cpf = ? AND role = ?',
      [cleanCPF, role]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado', 
        needsRegistration: true 
      });
    }
    
    const user = rows[0];
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
    
    // Validar se CPF está autorizado para DP
    if (role === 'dp' && !AUTHORIZED_DP_CPFS.includes(cleanCPF)) {
      return res.status(403).json({ 
        error: 'CPF não autorizado para acesso ao Departamento Pessoal. Entre em contato com a administração.' 
      });
    }
    
    // Validar se CPF está autorizado para Gestor
    if (role === 'gestor' && !AUTHORIZED_GESTOR_CPFS.includes(cleanCPF)) {
      return res.status(403).json({ 
        error: 'CPF não autorizado para acesso como Gestor. Entre em contato com a administração.' 
      });
    }
    
    // Verificar se usuário já existe
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE cpf = ?',
      [cleanCPF]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Usuário já cadastrado' });
    }
    
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (cpf, nome, email, senha, role, setor) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanCPF, nome.trim(), email.trim(), hashedPassword, role, setor]
    );
    
    const [newUser] = await pool.query(
      'SELECT id, cpf, nome, email, role, setor, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      user: newUser[0]
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
    
    const [rows] = await pool.query(
      'SELECT id, cpf, nome, email, role, setor FROM users WHERE cpf = ? AND role = ?',
      [cleanCPF, role]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({
      success: true,
      user: rows[0]
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [result] = await pool.query(
      'UPDATE users SET senha = ? WHERE cpf = ? AND role = ?',
      [hashedPassword, cleanCPF, role]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
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
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;
    
    let query = `
      SELECT 
        t.*,
        u1.nome as solicitante_nome,
        u2.nome as assigned_nome
      FROM tickets t
      LEFT JOIN users u1 ON t.solicitante_id = u1.id
      LEFT JOIN users u2 ON t.assigned_id = u2.id
    `;
    
    const conditions = [];
    const params = [];
    
    // Filtrar por role
    if (user.role === 'colaborador') {
      conditions.push('t.solicitante_id = ?');
      params.push(user.id);
    } else if (user.role === 'gestor') {
      // Buscar setor do usuário
      const [userRows] = await pool.query('SELECT setor FROM users WHERE id = ?', [user.id]);
      if (userRows.length > 0) {
        conditions.push('t.setor = ?');
        params.push(userRows[0].setor);
      }
    }
    // DP vê todos os tickets
    
    // Filtrar por status se especificado
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    // Buscar comentários para cada ticket
    for (let ticket of rows) {
      const [comments] = await pool.query(
        `SELECT c.*, u.nome as autor_nome 
         FROM comments c 
         JOIN users u ON c.autor_id = u.id 
         WHERE c.ticket_id = ? 
         ORDER BY c.created_at ASC`,
        [ticket.id]
      );
      ticket.comments = comments;
    }
    
    res.json(rows);
    
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { setor, categoria, prioridade, assunto, descricao } = req.body;
    const user = req.user;
    
    if (!setor || !categoria || !prioridade || !assunto || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const numero = await generateTicketNumber();
    
    const [result] = await pool.query(
      `INSERT INTO tickets (numero, solicitante_id, categoria, prioridade, assunto, descricao, setor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [numero, user.id, categoria, prioridade, assunto.trim(), descricao.trim(), setor]
    );
    
    const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    const ticket = ticketRows[0];
    ticket.solicitante_nome = user.nome;
    ticket.comments = [];
    
    res.status(201).json({
      success: true,
      message: 'Ticket criado com sucesso',
      ticket
    });
    
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter ticket específico
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const user = req.user;
    
    const [rows] = await pool.query(
      `SELECT 
        t.*,
        u1.nome as solicitante_nome,
        u2.nome as assigned_nome
       FROM tickets t
       LEFT JOIN users u1 ON t.solicitante_id = u1.id
       LEFT JOIN users u2 ON t.assigned_id = u2.id
       WHERE t.id = ?`,
      [ticketId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    const ticket = rows[0];
    
    // Verificar permissões
    if (user.role === 'colaborador' && ticket.solicitante_id !== user.id) {
      return res.status(403).json({ error: 'Sem permissão para ver este ticket' });
    }
    
    if (user.role === 'gestor') {
      const [userRows] = await pool.query('SELECT setor FROM users WHERE id = ?', [user.id]);
      if (userRows.length > 0 && ticket.setor !== userRows[0].setor) {
        return res.status(403).json({ error: 'Sem permissão para ver este ticket' });
      }
    }
    
    // Buscar comentários
    const [comments] = await pool.query(
      `SELECT c.*, u.nome as autor_nome 
       FROM comments c 
       JOIN users u ON c.autor_id = u.id 
       WHERE c.ticket_id = ? 
       ORDER BY c.created_at ASC`,
      [ticketId]
    );
    
    ticket.comments = comments;
    
    res.json(ticket);
    
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DP adicionar resposta ao ticket
app.put('/api/tickets/:id/resposta', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { resposta } = req.body;
    const user = req.user;
    
    if (!resposta || !resposta.trim()) {
      return res.status(400).json({ error: 'Resposta é obrigatória' });
    }
    
    // Apenas DP e gestores podem adicionar resposta
    if (user.role === 'colaborador') {
      return res.status(403).json({ error: 'Sem permissão para adicionar resposta' });
    }
    
    // Verificar se ticket existe
    const [checkRows] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
    
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    // Atualizar resposta e atribuir responsável se necessário
    const [currentTicket] = await pool.query('SELECT assigned_id FROM tickets WHERE id = ?', [ticketId]);
    const shouldAssign = currentTicket[0].assigned_id === null;
    
    if (shouldAssign) {
      await pool.query(
        'UPDATE tickets SET resposta = ?, assigned_id = ?, status = \'em-andamento\' WHERE id = ?',
        [resposta.trim(), user.id, ticketId]
      );
    } else {
      await pool.query(
        'UPDATE tickets SET resposta = ? WHERE id = ?',
        [resposta.trim(), ticketId]
      );
    }
    
    const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    
    res.json({
      success: true,
      message: 'Resposta adicionada com sucesso',
      ticket: ticketRows[0]
    });
    
  } catch (error) {
    console.error('Add resposta error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status do ticket
app.put('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    const user = req.user;
    
    if (!['aberto', 'em-andamento', 'resolvido'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Apenas DP e gestores podem alterar status
    if (user.role === 'colaborador') {
      return res.status(403).json({ error: 'Sem permissão para alterar status' });
    }
    
    // Atribuir responsável se ainda não tiver
    const [checkRows] = await pool.query('SELECT assigned_id FROM tickets WHERE id = ?', [ticketId]);
    
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    const shouldAssign = checkRows[0].assigned_id === null;
    
    if (shouldAssign) {
      await pool.query(
        'UPDATE tickets SET status = ?, assigned_id = ? WHERE id = ?',
        [status, user.id, ticketId]
      );
    } else {
      await pool.query(
        'UPDATE tickets SET status = ? WHERE id = ?',
        [status, ticketId]
      );
    }
    
    const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    
    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      ticket: ticketRows[0]
    });
    
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar comentário ao ticket
app.post('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { comentario } = req.body;
    const user = req.user;
    
    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ error: 'Comentário é obrigatório' });
    }
    
    // Verificar se ticket existe
    const [ticketCheck] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
    
    if (ticketCheck.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO comments (ticket_id, autor_id, comentario) VALUES (?, ?, ?)',
      [ticketId, user.id, comentario.trim()]
    );
    
    const [commentRows] = await pool.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
    const comment = commentRows[0];
    comment.autor_nome = user.nome;
    
    // Atualizar updated_at do ticket
    await pool.query('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ticketId]);
    
    res.status(201).json({
      success: true,
      message: 'Comentário adicionado com sucesso',
      comment
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas do dashboard
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    let whereClause = '';
    const params = [];
    
    if (user.role === 'colaborador') {
      whereClause = 'WHERE solicitante_id = ?';
      params.push(user.id);
    } else if (user.role === 'gestor') {
      const [userRows] = await pool.query('SELECT setor FROM users WHERE id = ?', [user.id]);
      if (userRows.length > 0) {
        whereClause = 'WHERE setor = ?';
        params.push(userRows[0].setor);
      }
    }
    
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as abertos,
        SUM(CASE WHEN status = 'em-andamento' THEN 1 ELSE 0 END) as andamento,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvidos
      FROM tickets
      ${whereClause}
    `;
    
    const [rows] = await pool.query(query, params);
    
    const stats = {
      total: parseInt(rows[0].total),
      abertos: parseInt(rows[0].abertos),
      andamento: parseInt(rows[0].andamento),
      resolvidos: parseInt(rows[0].resolvidos)
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Exportar tickets (apenas para DP e gestores)
app.get('/api/tickets/export', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'colaborador') {
      return res.status(403).json({ error: 'Sem permissão para exportar' });
    }
    
    let whereClause = '';
    const params = [];
    
    if (user.role === 'gestor') {
      const [userRows] = await pool.query('SELECT setor FROM users WHERE id = ?', [user.id]);
      if (userRows.length > 0) {
        whereClause = 'WHERE t.setor = ?';
        params.push(userRows[0].setor);
      }
    }
    
    const [rows] = await pool.query(
      `SELECT 
        t.id, t.numero, u.nome as solicitante, t.categoria, 
        t.prioridade, t.assunto, t.status, t.setor, t.created_at
       FROM tickets t
       JOIN users u ON t.solicitante_id = u.id
       ${whereClause}
       ORDER BY t.created_at DESC`,
      params
    );
    
    // Gerar CSV
    const csvHeaders = 'ID,Número,Solicitante,Categoria,Prioridade,Assunto,Status,Setor,Data Criação\n';
    const csvData = rows.map(ticket => {
      const date = new Date(ticket.created_at).toLocaleDateString('pt-BR');
      return `${ticket.id},${ticket.numero},"${ticket.solicitante}","${ticket.categoria}","${ticket.prioridade}","${ticket.assunto}","${ticket.status}","${ticket.setor}","${date}"`;
    }).join('\n');
    
    const csv = csvHeaders + csvData;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
    res.send('\ufeff' + csv);
    
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
    database: 'MySQL', 
    timestamp: new Date().toISOString()
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

// Inicializar banco e servidor
initializeDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`💾 Banco de dados: MySQL (Railway)`);
      console.log('📝 Credenciais de teste:');
      console.log('   Admin DP: CPF 12345678901, Senha: 123456');
      console.log('   Gestor: CPF 98765432101, Senha: 123456');
    });
  })
  .catch((error) => {
    console.error('❌ Erro fatal ao iniciar:', error);
    process.exit(1);
  });
