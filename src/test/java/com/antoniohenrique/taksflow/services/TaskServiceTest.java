package com.antoniohenrique.taksflow.services;

import com.antoniohenrique.taksflow.dtos.TaskRequestDTO;
import com.antoniohenrique.taksflow.dtos.TaskResponseDTO;
import com.antoniohenrique.taksflow.models.Task;
import com.antoniohenrique.taksflow.models.TaskPriority;
import com.antoniohenrique.taksflow.models.TaskStatus;
import com.antoniohenrique.taksflow.models.User;
import com.antoniohenrique.taksflow.repositorys.TaskRepository;
import com.antoniohenrique.taksflow.repositorys.UserRepository;
import com.antoniohenrique.taksflow.services.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private User user;
    private Task task;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setName("João");
        user.setEmail("joao@email.com");

        task = new Task();
        task.setId(1L);
        task.setTitle("Estudar Spring");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(TaskPriority.HIGH);
        task.setUser(user);
    }

    @Test
    void shouldReturnTasksForUser() {
        Long userId = 1L;
        when(taskRepository.findByUserId(userId)).thenReturn(List.of(task));

        List<TaskResponseDTO> result = taskService.getAllTasksByUser(userId);

        assertEquals(1, result.size());
        assertEquals("Estudar Spring", result.get(0).getTitle());
        verify(taskRepository, times(1)).findByUserId(userId);
    }

    @Test
    void shouldThrowWhenDeletingTaskOfAnotherUser() {
        Long taskId = 1L;
        Long userId = 1L;
        Long otherUserId = 2L;

        User otherUser = new User();
        otherUser.setId(otherUserId);
        
        Task otherTask = new Task();
        otherTask.setId(taskId);
        otherTask.setUser(otherUser);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(otherTask));

        assertThrows(RuntimeException.class, () -> taskService.deleteTask(taskId, userId));
    }

    @Test
    void shouldCreateTask() {
        TaskRequestDTO dto = new TaskRequestDTO();
        dto.setTitle("Nova Tarefa");
        dto.setDescription("Descrição");
        dto.setPriority(TaskPriority.MEDIUM);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponseDTO result = taskService.createTask(dto, 1L);

        assertNotNull(result);
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        TaskRequestDTO dto = new TaskRequestDTO();
        dto.setTitle("Nova Tarefa");

        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> taskService.createTask(dto, 1L));
    }
}