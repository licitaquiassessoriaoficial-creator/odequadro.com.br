
# CPFs Autorizados para Departamento Pessoal

## Como adicionar novos CPFs autorizados

Para permitir que um CPF acesse o sistema como **Departamento Pessoal (DP)**, siga os passos:

### 1. Editar o arquivo `server.js`

Localize a seção no início do arquivo (linhas 11-15):

```javascript
// CPFs autorizados para Departamento Pessoal (DP)
const AUTHORIZED_DP_CPFS = [
  '12345678901', // Admin Sistema (teste)
  // Adicione aqui os CPFs autorizados para acessar o DP
];
```

### 2. Adicionar o CPF sem pontos ou traços

Adicione o CPF **apenas com números** (11 dígitos), com um comentário identificando a pessoa:

```javascript
const AUTHORIZED_DP_CPFS = [
  '12345678901', // Admin Sistema (teste)
  '98765432100', // Maria Silva - RH
  '11122233344', // João Santos - DP
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
- Apenas CPFs nesta lista poderão se cadastrar como DP
- Mesmo que alguém tente se cadastrar como DP, o sistema bloqueará se o CPF não estiver na lista
- No login, o sistema também valida se o CPF está autorizado
- Mantenha esta lista atualizada e revise periodicamente

## CPF de Teste (Desenvolvimento)

- **CPF:** 12345678901
- **Senha:** 123456
- **Nome:** Admin Sistema
- **Uso:** Apenas para testes e desenvolvimento

## Processo para Usuário Final

1. Usuário com CPF autorizado acessa o sistema
2. Escolhe "Departamento Pessoal" no tipo de acesso
3. Faz o cadastro normalmente
4. Sistema valida o CPF na lista de autorizados
5. Se autorizado: cadastro aprovado ✅
6. Se NÃO autorizado: mensagem de erro ❌

## Mensagens de Erro

### No Cadastro
> "CPF não autorizado para acesso ao Departamento Pessoal. Entre em contato com a administração."

### No Login
> "Acesso negado. CPF não autorizado para o Departamento Pessoal."

---

**Desenvolvido por Bela Nascimento**
