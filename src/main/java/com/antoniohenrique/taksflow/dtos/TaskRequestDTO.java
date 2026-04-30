package com.antoniohenrique.taksflow.dtos;

import com.antoniohenrique.taksflow.models.TaskPriority;
import com.antoniohenrique.taksflow.models.TaskStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class TaskRequestDTO {

    @NotBlank(message = "Título é obrigatório")
    private String title;

    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate dueDate;

    public TaskRequestDTO() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public TaskPriority getPriority() {
        return priority;
    }

    public void setPriority(TaskPriority priority) {
        this.priority = priority;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}