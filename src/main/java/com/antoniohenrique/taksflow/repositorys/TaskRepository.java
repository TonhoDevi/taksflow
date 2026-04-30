package com.antoniohenrique.taksflow.repositorys;

import com.antoniohenrique.taksflow.models.Task;
import com.antoniohenrique.taksflow.models.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    List<Task> findByUserIdAndStatus(Long userId, TaskStatus status);
}