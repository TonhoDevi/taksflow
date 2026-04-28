# TaskFlow — Guia Completo de Desenvolvimento
> Gerenciador de Tarefas com Spring Boot, React, Docker e JWT

---

## Antes de começar

### O que você vai precisar instalado
- **JDK 17+** → https://adoptium.net
- **Maven** → https://maven.apache.org/download.cgi
- **Docker Desktop** → https://www.docker.com/products/docker-desktop
- **Node.js 18+** → https://nodejs.org
- **IntelliJ IDEA** (recomendado) ou VS Code

### Estrutura final do projeto
```
taskflow/
├── backend/          ← Spring Boot
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/         ← React
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

# SEMANA 1 — Backend Sólido

## Passo 1 — Criar o projeto Spring Boot

1. Acesse https://start.spring.io
2. Configure assim:
   - **Project:** Maven
   - **Language:** Java
   - **Spring Boot:** 3.2.x
   - **Group:** com.antoniohenrique
   - **Artifact:** taskflow
   - **Packaging:** Jar
   - **Java:** 17

3. Adicione as dependências:
   - Spring Web
   - Spring Data JPA
   - PostgreSQL Driver
   - Spring Security
   - Spring Boot DevTools
   - Validation
   - Lombok

4. Clique em **Generate**, extraia o zip e abra no IntelliJ.

---

## Passo 2 — Configurar o banco com Docker Compose

Crie o arquivo `docker-compose.yml` na raiz do projeto:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: taskflow-db
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Para subir o banco, rode no terminal:
```bash
docker-compose up -d
```

---

## Passo 3 — Configurar o application.properties

No arquivo `src/main/resources/application.properties`:

```properties
# Banco de dados
spring.datasource.url=jdbc:postgresql://localhost:5432/taskflow
spring.datasource.username=postgres
spring.datasource.password=postgres

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Porta
server.port=8080

# JWT (você vai criar essa chave na Semana 2)
jwt.secret=sua_chave_secreta_aqui
jwt.expiration=86400000
```

---

## Passo 4 — Criar as entidades (models)

Crie o pacote `model` dentro de `com.antoniohenrique.taskflow`.

### User.java
```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

### Task.java
```java
@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    private TaskPriority priority = TaskPriority.MEDIUM;

    private LocalDate dueDate;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

### TaskStatus.java (enum)
```java
public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    DONE
}
```

### TaskPriority.java (enum)
```java
public enum TaskPriority {
    LOW,
    MEDIUM,
    HIGH
}
```

---

## Passo 5 — Criar os Repositories

Crie o pacote `repository`.

### UserRepository.java
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### TaskRepository.java
```java
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);
}
```

---

## Passo 6 — Criar os DTOs

DTOs são objetos usados para transferência de dados — você nunca expõe a entidade diretamente na API. Crie o pacote `dto`.

### TaskRequestDTO.java
```java
@Data
public class TaskRequestDTO {

    @NotBlank(message = "Título é obrigatório")
    private String title;

    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
}
```

### TaskResponseDTO.java
```java
@Data
@AllArgsConstructor
public class TaskResponseDTO {
    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
}
```

---

## Passo 7 — Criar o Service de Tasks

Crie o pacote `service`.

### TaskService.java
```java
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<TaskResponseDTO> getAllTasksByUser(Long userId) {
        return taskRepository.findByUserId(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TaskResponseDTO createTask(TaskRequestDTO dto, Long userId) {
        // Aqui você vai buscar o User e setar na Task
        // Implemente após configurar o Spring Security na Semana 2
        throw new UnsupportedOperationException("Implemente após configurar JWT");
    }

    public TaskResponseDTO updateTask(Long taskId, TaskRequestDTO dto, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado");
        }

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setStatus(dto.getStatus());
        task.setPriority(dto.getPriority());
        task.setDueDate(dto.getDueDate());

        return toDTO(taskRepository.save(task));
    }

    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));

        if (!task.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado");
        }

        taskRepository.delete(task);
    }

    private TaskResponseDTO toDTO(Task task) {
        return new TaskResponseDTO(
            task.getId(), task.getTitle(), task.getDescription(),
            task.getStatus(), task.getPriority(), task.getDueDate(), task.getCreatedAt()
        );
    }
}
```

---

## Passo 8 — Criar o Controller de Tasks (sem segurança ainda)

Crie o pacote `controller`.

### TaskController.java
```java
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponseDTO>> getAll() {
        // userId virá do token JWT na Semana 2
        // Por enquanto, use um userId fixo para testar
        return ResponseEntity.ok(taskService.getAllTasksByUser(1L));
    }

    @PostMapping
    public ResponseEntity<TaskResponseDTO> create(@Valid @RequestBody TaskRequestDTO dto) {
        return ResponseEntity.status(201).body(taskService.createTask(dto, 1L));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> update(@PathVariable Long id,
                                                   @Valid @RequestBody TaskRequestDTO dto) {
        return ResponseEntity.ok(taskService.updateTask(id, dto, 1L));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.deleteTask(id, 1L);
        return ResponseEntity.noContent().build();
    }
}
```

### Teste no terminal com curl:
```bash
# Criar uma tarefa
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Minha primeira tarefa", "priority": "HIGH"}'

# Listar tarefas
curl http://localhost:8080/api/tasks
```

---

# SEMANA 2 — Segurança e Qualidade

## Passo 9 — Adicionar dependência JWT no pom.xml

Dentro de `<dependencies>` no `pom.xml`:

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

---

## Passo 10 — Criar o JwtService

Crie o pacote `security`.

### JwtService.java
```java
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Key getKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }
}
```

---

## Passo 11 — Criar o filtro JWT

### JwtAuthFilter.java
```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        String email = jwtService.extractEmail(token);

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (jwtService.isTokenValid(token)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

---

## Passo 12 — Configurar o Spring Security

### SecurityConfig.java
```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

---

## Passo 13 — Criar o AuthService (registro e login)

### DTOs de auth

```java
// RegisterRequestDTO.java
@Data
public class RegisterRequestDTO {
    @NotBlank private String name;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 6) private String password;
}

// LoginRequestDTO.java
@Data
public class LoginRequestDTO {
    @Email @NotBlank private String email;
    @NotBlank private String password;
}

// AuthResponseDTO.java
@Data @AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String name;
    private String email;
}
```

### AuthService.java
```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("E-mail já cadastrado");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponseDTO(token, user.getName(), user.getEmail());
    }

    public AuthResponseDTO login(LoginRequestDTO dto) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
        );
        User user = userRepository.findByEmail(dto.getEmail()).orElseThrow();
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponseDTO(token, user.getName(), user.getEmail());
    }
}
```

### AuthController.java
```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO dto) {
        return ResponseEntity.status(201).body(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }
}
```

---

## Passo 14 — Atualizar o TaskController para usar o usuário autenticado

Agora que o JWT está configurado, atualize o controller para pegar o userId real do token:

```java
// Método helper — adicione no controller
private Long getAuthenticatedUserId() {
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"))
            .getId();
}

// Substitua todos os `1L` nos métodos pelo retorno desse helper
```

---

## Passo 15 — Testes com JUnit e Mockito

Crie os testes em `src/test/java/com/antoniohenrique/taskflow/`.

### TaskServiceTest.java
```java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void shouldReturnTasksForUser() {
        // Arrange
        Long userId = 1L;
        Task task = new Task();
        task.setId(1L);
        task.setTitle("Estudar Spring");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(TaskPriority.HIGH);

        User user = new User();
        user.setId(userId);
        task.setUser(user);

        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task));

        // Act
        List<TaskResponseDTO> result = taskService.getAllTasksByUser(userId);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Estudar Spring", result.get(0).getTitle());
        verify(taskRepository, times(1)).findByUserId(userId);
    }

    @Test
    void shouldThrowWhenDeletingTaskOfAnotherUser() {
        // Arrange
        Long taskId = 1L;
        Long userId = 1L;
        Long otherUserId = 2L;

        User owner = new User(); owner.setId(otherUserId);
        Task task = new Task(); task.setId(taskId); task.setUser(owner);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> taskService.deleteTask(taskId, userId));
    }
}
```

Para rodar os testes:
```bash
mvn test
```

---

## Passo 16 — Adicionar Swagger (documentação da API)

Adicione ao `pom.xml`:
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

Adicione ao `application.properties`:
```properties
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

Anote seus controllers para documentar melhor:
```java
@Tag(name = "Tarefas", description = "Endpoints para gerenciamento de tarefas")
@Operation(summary = "Listar todas as tarefas do usuário")
```

Acesse: http://localhost:8080/swagger-ui.html

---

# SEMANA 3 — Frontend com React

## Passo 17 — Criar o projeto React

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
```

---

## Passo 18 — Estrutura de pastas do frontend

```
frontend/src/
├── api/
│   └── axios.js         ← configuração base do axios
├── components/
│   ├── TaskCard.jsx
│   ├── TaskForm.jsx
│   └── Navbar.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Dashboard.jsx
├── context/
│   └── AuthContext.jsx  ← estado global de autenticação
└── App.jsx
```

---

## Passo 19 — Configurar o Axios com token

### api/axios.js
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

// Interceptor: adiciona o token em todas as requisições automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Passo 20 — Criar o contexto de autenticação

### context/AuthContext.jsx
```jsx
import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
    setUser({ name: data.name, email: data.email });
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
    setUser({ name: data.name, email: data.email });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Passo 21 — Página de Login

### pages/Login.jsx
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch {
      setError('E-mail ou senha inválidos');
    }
  }

  return (
    <div className="login-container">
      <h1>TaskFlow</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p>Não tem conta? <Link to="/register">Cadastre-se</Link></p>
    </div>
  );
}
```

---

## Passo 22 — Dashboard com listagem de tarefas

### pages/Dashboard.jsx
```jsx
import { useEffect, useState } from 'react';
import api from '../api/axios';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const { data } = await api.get('/tasks');
    setTasks(data);
  }

  async function handleDelete(id) {
    await api.delete(`/tasks/${id}`);
    setTasks(tasks.filter(t => t.id !== id));
  }

  async function handleStatusChange(id, status) {
    await api.put(`/tasks/${id}`, { status });
    fetchTasks();
  }

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="dashboard">
      <header>
        <h2>Minhas Tarefas</h2>
        <button onClick={() => setShowForm(true)}>+ Nova Tarefa</button>
      </header>

      <div className="filters">
        {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map(s => (
          <button
            key={s}
            className={filter === s ? 'active' : ''}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'Todas' : s === 'TODO' ? 'A Fazer' : s === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluídas'}
          </button>
        ))}
      </div>

      <div className="task-list">
        {filtered.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); fetchTasks(); }}
        />
      )}
    </div>
  );
}
```

---

## Passo 23 — Componente TaskCard

### components/TaskCard.jsx
```jsx
export default function TaskCard({ task, onDelete, onStatusChange }) {
  const priorityColors = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

  return (
    <div className="task-card">
      <div className="task-header">
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColors[task.priority] }}
        >
          {task.priority}
        </span>
        <button className="delete-btn" onClick={() => onDelete(task.id)}>✕</button>
      </div>

      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      {task.dueDate && <small>Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</small>}

      <select
        value={task.status}
        onChange={e => onStatusChange(task.id, e.target.value)}
      >
        <option value="TODO">A Fazer</option>
        <option value="IN_PROGRESS">Em Progresso</option>
        <option value="DONE">Concluída</option>
      </select>
    </div>
  );
}
```

---

# SEMANA 4 — Deploy e Finalização

## Passo 24 — Dockerfile do Backend

```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Passo 25 — Atualizar o docker-compose.yml para subir tudo

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: taskflow-db
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: taskflow-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/taskflow
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    container_name: taskflow-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

Com isso, qualquer recrutador ou dev clona o projeto e sobe tudo com:
```bash
docker-compose up --build
```

---

## Passo 26 — Deploy gratuito no Railway

1. Crie conta em https://railway.app
2. Clique em **New Project → Deploy from GitHub**
3. Selecione seu repositório
4. Adicione um serviço PostgreSQL pelo painel
5. Configure as variáveis de ambiente (JWT_SECRET, etc.)
6. O Railway detecta automaticamente o Dockerfile e faz o deploy

**URL pública gerada automaticamente** — coloque no README e no currículo.

---

## Passo 27 — README profissional

O README é o cartão de visitas do projeto. Estrutura ideal:

```markdown
# TaskFlow

> Gerenciador de tarefas com autenticação JWT, API REST documentada e deploy em produção.

## 🔗 Demo ao vivo
[taskflow-production.up.railway.app](https://sua-url-aqui)

## 📸 Preview
[insira um gif gravado com o Kap (Mac) ou ScreenToGif (Windows)]

## 🛠️ Tecnologias
Backend: Java 17, Spring Boot 3, Spring Security, JWT, PostgreSQL, JPA/Hibernate
Frontend: React, Axios, React Router
Infra: Docker, Docker Compose, Railway

## 🚀 Como rodar localmente
\`\`\`bash
git clone https://github.com/TonhoDevi/taskflow
cd taskflow
docker-compose up --build
\`\`\`
Acesse: http://localhost:3000

## 📄 Documentação da API
http://localhost:8080/swagger-ui.html
```

---

## Checklist final antes de divulgar

- [ ] A aplicação sobe com `docker-compose up --build` sem erros
- [ ] Registro e login funcionam e retornam token JWT
- [ ] CRUD de tarefas funciona com autenticação
- [ ] Testes passam com `mvn test`
- [ ] Swagger acessível em `/swagger-ui.html`
- [ ] Deploy rodando e URL pública funcionando
- [ ] README com gif demonstrativo e link da demo
- [ ] Repositório público no GitHub
- [ ] Link adicionado no LinkedIn e currículo

---

## O que esse projeto prova para um recrutador

| Competência | Como aparece no projeto |
|---|---|
| Backend profissional | Spring Boot com arquitetura em camadas |
| Segurança | JWT + Spring Security |
| Banco de dados | PostgreSQL com JPA/Hibernate |
| Frontend moderno | React com gerenciamento de estado |
| DevOps básico | Docker + Docker Compose |
| Qualidade de código | Testes com JUnit e Mockito |
| Documentação | Swagger/OpenAPI |
| Entrega | Deploy em produção com URL pública |

**Boa sorte, Antonio. Agora é só construir.** 🚀