# TaksFlow

API REST para gerenciamento de tarefas (tasks) com autenticação JWT.

## Tecnologias

- **Java 21**
- **Spring Boot 3.2.5**
- **Spring Security**
- **Spring Data JPA**
- **PostgreSQL** (banco de dados)
- **H2** (banco de dados para testes)
- **JWT** (autenticação)
- **Swagger/OpenAPI** (documentação)
- **Maven**

## Configuração

### Banco de Dados

Configure as variáveis no arquivo `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/taskflow
spring.datasource.username=postgres
spring.datasource.password=postgres
```

### Variáveis JWT

```properties
jwt.secret=sua-chave-secreta-aqui
jwt.expiration=86400000
```

## Como Rodar

```bash
./mvnw spring-boot:run
```

A API estará disponível em `http://localhost:8080`

## Documentação (Swagger)

Acesse a documentação interativa em: `http://localhost:8080/swagger-ui.html`

## Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login` | Login e obter token JWT |

### Tarefas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tasks` | Listar tarefas do usuário |
| POST | `/api/tasks` | Criar nova tarefa |
| PUT | `/api/tasks/{id}` | Atualizar tarefa |
| DELETE | `/api/tasks/{id}` | Deletar tarefa |

**Observação:** Endpoints de tarefas requerem autenticação via token JWT no header `Authorization: Bearer <token>`.