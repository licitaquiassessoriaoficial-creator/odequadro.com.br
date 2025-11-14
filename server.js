const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database connection
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'railway',
  port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306
};

let db;

async function connectDB() {
  try {
    console.log('Attempting to connect to database with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database successfully');
    
    // Initialize tables
    await initializeTables();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.log('Available environment variables:');
    console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
    console.log('MYSQL_USER:', process.env.MYSQL_USER);
    console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
  }
}

async function initializeTables() {
  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        senha VARCHAR(255) NOT NULL,
        role ENUM('colaborador', 'gestor', 'dp') NOT NULL,
        setor VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tickets table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(20) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        categoria ENUM('ponto', 'beneficios', 'ferias', 'pagamento', 'documentos', 'outros') NOT NULL,
        prioridade ENUM('baixa', 'media', 'alta', 'urgente') NOT NULL,
        assunto VARCHAR(200) NOT NULL,
        descricao TEXT NOT NULL,
        status ENUM('aberto', 'em-andamento', 'resolvido', 'fechado') DEFAULT 'aberto',
        assigned_to INT NULL,
        resposta TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);

    // Ticket comments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        comentario TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create default admin user if not exists
    const [existingUsers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "dp"');
    if (existingUsers[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.execute(`
        INSERT INTO users (cpf, nome, email, senha, role, setor) 
        VALUES ('00000000000', 'Administrador', 'admin@odequadro.com', ?, 'dp', 'Departamento Pessoal')
      `, [hashedPassword]);
      console.log('Default admin user created');
    }

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

// Generate ticket number
function generateTicketNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `T${year}${month}${random}`;
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'odequadro-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { cpf, senha, role } = req.body;

    const [users] = await db.execute(
      'SELECT * FROM users WHERE cpf = ? AND role = ?',
      [cpf, role]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(senha, user.senha);

    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        cpf: user.cpf, 
        nome: user.nome, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'odequadro-secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        cpf: user.cpf,
        role: user.role,
        setor: user.setor
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Register user (only for admin)
app.post('/api/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'dp') {
      return res.status(403).json({ error: 'Apenas o Departamento Pessoal pode cadastrar usuários' });
    }

    const { cpf, nome, email, senha, role, setor } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE cpf = ?', [cpf]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Usuário já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    await db.execute(`
      INSERT INTO users (cpf, nome, email, senha, role, setor) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cpf, nome, email, hashedPassword, role, setor]);

    res.json({ message: 'Usuário cadastrado com sucesso' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { categoria, prioridade, assunto, descricao } = req.body;
    const numero = generateTicketNumber();

    const [result] = await db.execute(`
      INSERT INTO tickets (numero, user_id, categoria, prioridade, assunto, descricao) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [numero, req.user.id, categoria, prioridade, assunto, descricao]);

    res.json({
      message: 'Ticket criado com sucesso',
      ticket: {
        id: result.insertId,
        numero: numero
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
});

// Get tickets
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, categoria } = req.query;
    let query = `
      SELECT t.*, u.nome as solicitante_nome, u.setor,
             a.nome as assigned_nome
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
    `;
    
    const conditions = [];
    const params = [];

    // Role-based filtering
    if (req.user.role === 'colaborador') {
      conditions.push('t.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    if (categoria) {
      conditions.push('t.categoria = ?');
      params.push(categoria);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const [tickets] = await db.execute(query, params);
    res.json(tickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Erro ao buscar tickets' });
  }
});

// Get ticket details
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const [tickets] = await db.execute(`
      SELECT t.*, u.nome as solicitante_nome, u.setor, u.email,
             a.nome as assigned_nome
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const ticket = tickets[0];

    // Check permissions
    if (req.user.role === 'colaborador' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Get comments
    const [comments] = await db.execute(`
      SELECT c.*, u.nome as autor_nome, u.role as autor_role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    ticket.comments = comments;
    res.json(ticket);
  } catch (error) {
    console.error('Get ticket details error:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do ticket' });
  }
});

// Update ticket status
app.put('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, resposta } = req.body;

    // Only gestor and dp can update status
    if (req.user.role === 'colaborador') {
      return res.status(403).json({ error: 'Apenas gestores e DP podem atualizar status' });
    }

    await db.execute(`
      UPDATE tickets 
      SET status = ?, resposta = ?, assigned_to = ? 
      WHERE id = ?
    `, [status, resposta, req.user.id, req.params.id]);

    res.json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Add comment to ticket
app.post('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { comentario, is_internal = false } = req.body;

    await db.execute(`
      INSERT INTO ticket_comments (ticket_id, user_id, comentario, is_internal) 
      VALUES (?, ?, ?, ?)
    `, [req.params.id, req.user.id, comentario, is_internal]);

    res.json({ message: 'Comentário adicionado com sucesso' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário' });
  }
});

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    let whereClause = '';
    let params = [];

    if (req.user.role === 'colaborador') {
      whereClause = 'WHERE user_id = ?';
      params = [req.user.id];
    }

    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as abertos,
        SUM(CASE WHEN status = 'em-andamento' THEN 1 ELSE 0 END) as em_andamento,
        SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvidos
      FROM tickets ${whereClause}
    `, params);

    res.json(stats[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Attempting database connection...');
  connectDB();
});

module.exports = app;