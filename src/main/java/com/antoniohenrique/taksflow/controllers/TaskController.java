package com.antoniohenrique.taksflow.controllers;

import com.antoniohenrique.taksflow.dtos.TaskRequestDTO;
import com.antoniohenrique.taksflow.dtos.TaskResponseDTO;
import com.antoniohenrique.taksflow.repositorys.UserRepository;
import com.antoniohenrique.taksflow.services.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tarefas", description = "Endpoints para gerenciamento de tarefas")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    public TaskController(TaskService taskService, UserRepository userRepository) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"))
                .getId();
    }

    @GetMapping
    @Operation(summary = "Listar todas as tarefas do usuário")
    public ResponseEntity<List<TaskResponseDTO>> getAll() {
        return ResponseEntity.ok(taskService.getAllTasksByUser(getAuthenticatedUserId()));
    }

    @PostMapping
    @Operation(summary = "Criar uma nova tarefa")
    public ResponseEntity<TaskResponseDTO> create(@Valid @RequestBody TaskRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(dto, getAuthenticatedUserId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar uma tarefa existente")
    public ResponseEntity<TaskResponseDTO> update(@PathVariable Long id,
                                                   @Valid @RequestBody TaskRequestDTO dto) {
        return ResponseEntity.ok(taskService.updateTask(id, dto, getAuthenticatedUserId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir uma tarefa")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        taskService.deleteTask(id, getAuthenticatedUserId());
        return ResponseEntity.noContent().build();
    }
}