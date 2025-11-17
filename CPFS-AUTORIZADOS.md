
# CPFs Autorizados para Acesso Restrito

## Como adicionar novos CPFs autorizados

Para permitir que um CPF acesse o sistema como **Departamento Pessoal (DP)** ou **Gestor**, siga os passos:

### 1. Editar o arquivo `server.js`

Localize as seções no início do arquivo (linhas 12-22):

```javascript
// CPFs autorizados para Departamento Pessoal (DP)
const AUTHORIZED_DP_CPFS = [
  '12345678901', // Admin Sistema (teste)
  // Adicione aqui os CPFs autorizados para acessar o DP
];

// CPFs autorizados para Gestores
const AUTHORIZED_GESTOR_CPFS = [
  '98765432101', // Gestor Teste
  // Adicione aqui os CPFs autorizados para acessar como Gestor
];
```

### 2. Adicionar o CPF sem pontos ou traços

Adicione o CPF **apenas com números** (11 dígitos), com um comentário identificando a pessoa:

**Para Departamento Pessoal:**
```javascript
const AUTHORIZED_DP_CPFS = [
  '12345678901', // Admin Sistema (teste)
  '98765432100', // Maria Silva - RH
  '11122233344', // João Santos - DP
  // Adicione mais CPFs conforme necessário
];
```

**Para Gestores:**
```javascript
const AUTHORIZED_GESTOR_CPFS = [
  '98765432101', // Gestor Teste
  '55566677788', // Carlos Oliveira - Gestor Facilities
  '99988877766', // Ana Costa - Gestora RH
  // Adicione mais CPFs conforme necessário
];
```

### 3. Fazer commit e deploy

Após adicionar os CPFs:

```bash
git add server.js
git commit -m "feat: Adicionar CPFs autorizados para DP"
git push origin master
```

O Railway fará o deploy automaticamente.

## Segurança

⚠️ **IMPORTANTE:**
- Apenas CPFs nas listas poderão se cadastrar como DP ou Gestor
- Colaboradores podem se cadastrar livremente (sem restrição de CPF)
- Mesmo que alguém tente se cadastrar como DP ou Gestor, o sistema bloqueará se o CPF não estiver na lista
- No login, o sistema também valida se o CPF está autorizado para o tipo de acesso escolhido
- Mantenha estas listas atualizadas e revise periodicamente

## CPFs de Teste (Desenvolvimento)

**Departamento Pessoal:**
- **CPF:** 12345678901
- **Senha:** 123456
- **Nome:** Admin Sistema
- **Uso:** Apenas para testes e desenvolvimento

**Gestor:**
- **CPF:** 98765432101
- **Senha:** 123456
- **Nome:** Gestor Teste
- **Setor:** Facilities
- **Uso:** Apenas para testes e desenvolvimento

## Processo para Usuário Final

### Cadastro como DP:
1. Usuário com CPF autorizado acessa o sistema
2. Escolhe "Departamento Pessoal" no tipo de acesso
3. Faz o cadastro normalmente
4. Sistema valida o CPF na lista AUTHORIZED_DP_CPFS
5. Se autorizado: cadastro aprovado ✅
6. Se NÃO autorizado: mensagem de erro ❌

### Cadastro como Gestor:
1. Usuário com CPF autorizado acessa o sistema
2. Escolhe "Gestor" no tipo de acesso
3. Faz o cadastro normalmente
4. Sistema valida o CPF na lista AUTHORIZED_GESTOR_CPFS
5. Se autorizado: cadastro aprovado ✅
6. Se NÃO autorizado: mensagem de erro ❌

### Cadastro como Colaborador:
1. Qualquer usuário pode se cadastrar como colaborador
2. Não há validação de CPF para colaboradores
3. Cadastro liberado para todos ✅

## Mensagens de Erro

### No Cadastro (DP)
> "CPF não autorizado para acesso ao Departamento Pessoal. Entre em contato com a administração."

### No Login (DP)
> "Acesso negado. CPF não autorizado para o Departamento Pessoal."

### No Cadastro (Gestor)
> "CPF não autorizado para acesso como Gestor. Entre em contato com a administração."

### No Login (Gestor)
> "Acesso negado. CPF não autorizado para acesso como Gestor."

---

**Desenvolvido por Bela Nascimento**
