const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuração do MySQL
const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

let poolConfig;
let pool;

// Monta configuração do pool
function createPool() {
  console.log('🔍 Verificando variáveis de ambiente...');
  console.log('MYSQL_URL presente:', !!process.env.MYSQL_URL);
  console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
  console.log('MYSQLHOST presente:', !!process.env.MYSQLHOST);
  console.log('MYSQLUSER presente:', !!process.env.MYSQLUSER);

  if (databaseUrl) {
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
    }
  }

  if (!poolConfig && process.env.MYSQLHOST) {
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
  }

  if (!poolConfig) {
    throw new Error("❌ Nenhuma configuração MySQL válida encontrada.");
  }

  pool = mysql.createPool(poolConfig);
  return pool;
}

// Função principal para inicializar banco
async function initializeDatabase() {
  if (!pool) {
    createPool();
  }

  let connection;

  try {
    connection = await pool.getConnection();

    // Criar tabela users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        nome VARCHAR(100) NOT NULL,
        senha VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        setor VARCHAR(100),
        contratos VARCHAR(255),
        first_login BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Criar tabela tickets
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

    // Criar tabela comments
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

    // Usuários iniciais
    const usuarios = [
      { cpf: '55796696823', nome: 'Kevely', senha: 'Odq071123', role: 'dp', setor: 'Departamento Pessoal', contratos: '' },
      { cpf: '29539610893', nome: 'Kátia', senha: '874600', role: 'dp', setor: 'Departamento Pessoal', contratos: '' },
      { cpf: '26346512870', nome: 'Robinson Diretor', senha: '123456@', role: 'diretor', setor: 'Departamento Pessoal', contratos: '' },
      { cpf: '43091484840', nome: 'Isabela Nascimento', senha: '230919', role: 'ti', setor: 'TI', contratos: 'TI' },
      { cpf: '42507044837', nome: 'Rafael Santos', senha: 'Quadro8746#', role: 'ti', setor: 'TI', contratos: 'TI' },
      { cpf: '41360394842', nome: 'Guilherme Tosin', senha: '1senhadoGATI', role: 'gestor', setor: 'Gati', contratos: 'Gati' },
      { cpf: '44435264803', nome: 'Vinicius Santos', senha: 'senhaodq123', role: 'gestor', setor: 'Gati', contratos: 'Gati' },
      { cpf: '16514242847', nome: 'Clara Nave', senha: 'Crn150269', role: 'gestor', setor: 'P8/Metro', contratos: 'P8,Metro' },
      { cpf: '07374845782', nome: 'Alexandre Marçal', senha: 'asdfg12345', role: 'gestor', setor: 'ESUP', contratos: 'ESUP' },
      { cpf: '29826777846', nome: 'Cristiane Alves', senha: '654321', role: 'gestor', setor: 'Revap', contratos: 'Revap' },
      { cpf: '28058450804', nome: 'Adriano Bonfim', senha: 'Odq12345', role: 'gestor', setor: 'Multi', contratos: 'Transpetro Jurídico,Transpetro Logística,FURP,REPLAN' }
    ];

    for (const u of usuarios) {
      const [rows] = await connection.query('SELECT * FROM users WHERE cpf = ?', [u.cpf]);

      if (rows.length === 0) {
        const hashedPassword = await bcrypt.hash(u.senha, 10);

        await connection.query(
          'INSERT INTO users (cpf, nome, senha, role, setor, contratos, first_login) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
          [u.cpf, u.nome, hashedPassword, u.role, u.setor, u.contratos]
        );

        console.log(`✅ Usuário cadastrado: ${u.nome}`);
      } else {
        console.log(`ℹ️ Usuário já existe: ${u.nome}`);
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
