const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuração do MySQL - Railway pode fornecer URL ou variáveis separadas
const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

console.log('🔍 Verificando variáveis de ambiente...');
console.log('MYSQL_URL presente:', !!process.env.MYSQL_URL);
console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('MYSQLHOST presente:', !!process.env.MYSQLHOST);
console.log('MYSQLUSER presente:', !!process.env.MYSQLUSER);

let poolConfig;

if (databaseUrl) {
  // Opção 1: Usar URL completa
  try {
    const url = new URL(databaseUrl);
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000
    };
    console.log(`🔧 Conectando ao MySQL em ${url.hostname}:${url.port || 3306}`);
    console.log(`📊 Database: ${url.pathname.slice(1)}`);
    console.log(`👤 User: ${url.username}`);
  } catch (error) {
    console.error('❌ Erro ao parsear URL:', error);
    throw error;
  }
} else if (process.env.MYSQLHOST) {
  // Opção 2: Usar variáveis separadas do Railway
  poolConfig = {
    host: process.env.MYSQLHOST,
    port: parseInt(process.env.MYSQLPORT) || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000
  };
  console.log(`🔧 Conectando ao MySQL em ${process.env.MYSQLHOST}:${process.env.MYSQLPORT || 3306}`);
  console.log(`📊 Database: ${process.env.MYSQLDATABASE || 'railway'}`);
  console.log(`👤 User: ${process.env.MYSQLUSER}`);
} else {
  console.log('⚠️ Nenhuma URL de banco configurada, usando localhost');
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
        contratos TEXT,
        first_login BOOLEAN DEFAULT TRUE,
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
        status ENUM('aberto', 'em-andamento', 'resolvido', 'fechado') DEFAULT 'aberto',
        setor VARCHAR(100),
        contrato VARCHAR(100),
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
    
    // Criar tabela de currículos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS curriculos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        cargo VARCHAR(100) NOT NULL,
        linkedin VARCHAR(255),
        curriculo_path VARCHAR(255) NOT NULL,
        curriculo_nome VARCHAR(255) NOT NULL,
        mensagem TEXT,
        status ENUM('novo', 'em-analise', 'aprovado', 'reprovado') DEFAULT 'novo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_cargo (cargo),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabelas criadas/verificadas');
    
    // Verificar se já existem usuários
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    
    if (users[0].count === 0) {
      console.log('📝 Criando usuários iniciais...');
      
      // Criar usuário principal (Isabela - não precisa redefinir senha)
      const isabelaPassword = await bcrypt.hash('230919', 10);
      
      await connection.query(`
        INSERT INTO users (cpf, nome, email, senha, role, setor, contratos, first_login) VALUES
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        '43091484840', 'Isabela Nascimento', 'isabela.nascimento@odequadro.com', isabelaPassword, 'gestor', 'TI', 'TI', false,
        '44435264803', 'Vinicius Santos', 'vinicius.santos@odequadro.com', await bcrypt.hash('odq123', 10), 'gestor', 'Gati', 'Gati', false,
        '41360394842', 'Guilherme Tosin', 'guilherme.tosin@odequadro.com', await bcrypt.hash('1senhadoGATI', 10), 'gestor', 'Gati', 'Gati', false,
        '11111111111', 'Alexandre Marçal', 'alexandre.marcal@odequadro.com', await bcrypt.hash('esup123', 10), 'gestor', 'ESUP', 'ESUP', false,
        '22222222222', 'Clara Nave', 'clara.nave@odequadro.com', await bcrypt.hash('p8metro123', 10), 'gestor', 'P8/Metro', 'P8,Metro', false,
        '33333333333', 'Cristiane Silva', 'cristiane.silva@odequadro.com', await bcrypt.hash('revap123', 10), 'gestor', 'Revap', 'Revap', false,
        '44444444444', 'Adriano', 'adriano@odequadro.com', await bcrypt.hash('adriano123', 10), 'gestor', 'Multi', 'TJ,Transpetro Logística,Transpetro Jurídico,FURP,REPLAN', false
      ]);
      
      console.log('✅ Usuário principal criado (Isabela - Gestora TI)');
      console.log('   CPF: 43091484840, Role: gestor, Setor: TI, first_login: FALSE');
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
