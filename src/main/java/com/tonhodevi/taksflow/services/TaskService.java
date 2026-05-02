package com.tonhodevi.taksflow.services;

import com.tonhodevi.taksflow.dtos.TaskRequestDTO;
import com.tonhodevi.taksflow.dtos.TaskResponseDTO;
import com.tonhodevi.taksflow.models.Task;
import com.tonhodevi.taksflow.models.TaskStatus;
import com.tonhodevi.taksflow.models.User;
import com.tonhodevi.taksflow.repositorys.TaskRepository;
import com.tonhodevi.taksflow.repositorys.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public List<TaskResponseDTO> getAllTasksByUser(Long userId) {
        return taskRepository.findByUserId(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TaskResponseDTO createTask(TaskRequestDTO dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setStatus(dto.getStatus() != null ? dto.getStatus() : TaskStatus.TODO);
        task.setPriority(dto.getPriority());
        task.setDueDate(dto.getDueDate());
        task.setUser(user);

        return toDTO(taskRepository.save(task));
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
            task.getId(), 
            task.getTitle(), 
            task.getDescription(),
            task.getStatus(), 
            task.getPriority(), 
            task.getDueDate(), 
            task.getCreatedAt()
        );
    }
}