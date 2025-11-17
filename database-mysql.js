const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuração do MySQL - Railway fornece MYSQL_URL ou DATABASE_URL
const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

let poolConfig;

if (databaseUrl) {
  // Railway fornece URL no formato: mysql://user:password@host:port/database
  // mysql2 aceita a URL diretamente como string
  poolConfig = databaseUrl;
} else {
  // Desenvolvimento local
  poolConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'odequadro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

const pool = mysql.createPool(poolConfig);

// Inicializar banco de dados
async function initializeDatabase() {
  let connection;
  
  try {
    console.log('🔧 Conectando ao MySQL...');
    connection = await pool.getConnection();
    console.log('✅ Conectado ao MySQL do Railway');
    
    // Criar tabela de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cpf VARCHAR(11) UNIQUE NOT NULL,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        role ENUM('colaborador', 'gestor', 'dp') NOT NULL,
        setor VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cpf (cpf),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Criar tabela de tickets
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero VARCHAR(20) UNIQUE NOT NULL,
        solicitante_id INT NOT NULL,
        categoria ENUM('ponto', 'beneficios', 'ferias', 'pagamento', 'documentos', 'outros') NOT NULL,
        prioridade ENUM('baixa', 'media', 'alta', 'urgente') NOT NULL,
        assunto VARCHAR(200) NOT NULL,
        descricao TEXT NOT NULL,
        status ENUM('aberto', 'em-andamento', 'resolvido') NOT NULL DEFAULT 'aberto',
        setor VARCHAR(100),
        resposta TEXT,
        assigned_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (solicitante_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_solicitante (solicitante_id),
        INDEX idx_status (status),
        INDEX idx_setor (setor),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Criar tabela de comentários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        autor_id INT NOT NULL,
        comentario TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (autor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ticket (ticket_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabelas criadas/verificadas');
    
    // Verificar se já existem usuários
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('📝 Criando usuários iniciais...');
      
      // Criar usuários de teste
      const hashedPassword1 = await bcrypt.hash('123456', 10);
      const hashedPassword2 = await bcrypt.hash('123456', 10);
      
      await connection.query(`
        INSERT INTO users (cpf, nome, email, senha, role, setor) VALUES
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?)
      `, [
        '12345678901', 'Admin Sistema', 'admin@odequadro.com', hashedPassword1, 'dp', 'Departamento Pessoal',
        '98765432101', 'Gestor Teste', 'gestor@odequadro.com', hashedPassword2, 'gestor', 'Facilities'
      ]);
      
      console.log('✅ Usuários de teste criados');
      console.log('   Admin DP: CPF 12345678901, Senha: 123456');
      console.log('   Gestor: CPF 98765432101, Senha: 123456');
      
      // Criar ticket de exemplo
      const [adminUser] = await connection.query('SELECT id FROM users WHERE cpf = ?', ['12345678901']);
      const [gestorUser] = await connection.query('SELECT id FROM users WHERE cpf = ?', ['98765432101']);
      
      if (adminUser.length > 0 && gestorUser.length > 0) {
        await connection.query(`
          INSERT INTO tickets (numero, solicitante_id, categoria, prioridade, assunto, descricao, status, setor, assigned_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'ODQ001',
          gestorUser[0].id,
          'ponto',
          'media',
          'Correção no ponto eletrônico',
          'Preciso corrigir o horário de entrada do dia 10/11/2025',
          'aberto',
          'Facilities',
          adminUser[0].id
        ]);
        console.log('✅ Ticket de exemplo criado');
      }
    }
    
    console.log('✅ Banco de dados MySQL inicializado');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco MySQL:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { pool, initializeDatabase };
