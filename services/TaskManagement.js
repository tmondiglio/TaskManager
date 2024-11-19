export class TaskManagement {
    constructor() {
        this.tasks = [];
        this.API_URL = 'https://66fee6502b9aac9c997dc311.mockapi.io/Task';
        this.loadConfig();
        this.initializeApp();
    }

    initializeApp() {
        this.taskContainer = document.getElementById('taskContainer');
        this.newTaskBtn = document.getElementById('newTaskBtn');
        this.newTaskDialog = document.getElementById('newTaskDialog');
        this.filterDialog = document.getElementById('filterDialog');
        this.configDialog = document.getElementById('configDialog');
        this.editTaskDialog = document.getElementById('editTaskDialog');
        this.newTaskForm = document.getElementById('newTaskForm');
        this.editTaskForm = document.getElementById('editTaskForm');
        this.configForm = document.getElementById('configForm');
        this.menuBtn = document.querySelector('.menu-icon');

        this.setupEventListeners();
        this.loadTasks();
    }

    setupEventListeners() {
        this.newTaskBtn.addEventListener('click', () => {
            this.newTaskForm.reset();
            this.newTaskDialog.showModal();
        });

        this.newTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewTaskSubmit();
        });

        this.menuBtn.addEventListener('click', () => {
            this.showMenu();
        });

        this.filterDialog.querySelectorAll('[data-status]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterTasksByStatus(btn.dataset.status);
                this.filterDialog.close();
            });
        });

        this.configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(this.configForm);
            this.saveConfig({
                language: formData.get('language'),
                rate: parseFloat(formData.get('rate'))
            });
            this.configDialog.close();
        });

        const rateInput = this.configForm.querySelector('input[name="rate"]');
        rateInput.addEventListener('input', (e) => {
            const label = this.configForm.querySelector('label:last-of-type');
            label.textContent = `Velocidad de reproducción (${e.target.value})`;
        });
    }


    showMenu() {
        const menuDialog = document.createElement('dialog');
        menuDialog.innerHTML = `
            <div class="dialog-header">
                <h2>Menú</h2>
                <button class="close-button" onclick="this.closest('dialog').close()">×</button>
            </div>
            <div class="dialog-content">
                <div class="menu-option" id="filterOption">Filtrar Tareas</div>
                <div class="menu-option" id="configOption">Configuración</div>
            </div>
        `;

        document.body.appendChild(menuDialog);

        menuDialog.querySelector('#filterOption').addEventListener('click', () => {
            menuDialog.close();
            this.filterDialog.showModal();
        });

        menuDialog.querySelector('#configOption').addEventListener('click', () => {
            menuDialog.close();
            this.configDialog.showModal();
        });

        menuDialog.addEventListener('close', () => {
            menuDialog.remove();
        });

        menuDialog.showModal();
    }

    createTaskElement(task) {
        const statusClass = task.estado === 'completada' ? 'completed' :
            task.estado === 'en-proceso' ? 'in-progress' : 'pending';

        const div = document.createElement('div');
        div.className = `task-card ${statusClass}`;

        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';

        const statusIndicator = document.createElement('div');
        statusIndicator.className = `status-indicator ${statusClass}`;
        statusIndicator.textContent = task.estado === 'completada' ? 'Completada' :
            task.estado === 'en-proceso' ? 'En Proceso' : 'Pendiente';

        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.titulo;

        const date = document.createElement('div');
        date.className = 'task-date';
        date.textContent = new Date(task.fechacreacion).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        taskInfo.appendChild(statusIndicator);
        taskInfo.appendChild(title);
        taskInfo.appendChild(date);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'action-buttons';

        const actionButton = document.createElement('button');
        if (task.estado === 'completada') {
            actionButton.className = 'completed-icon';
            actionButton.innerHTML = '✓';
        } else {
            actionButton.className = 'play-button';
            actionButton.innerHTML = '▶';
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speakTask(task.descripcion);
            });
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '🗑️';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        buttonsContainer.appendChild(actionButton);
        buttonsContainer.appendChild(deleteButton);

        div.appendChild(taskInfo);
        div.appendChild(buttonsContainer);

        div.addEventListener('click', () => {
            this.showEditTaskDialog(task);
        });

        return div;
    }

    showEditTaskDialog(task) {
        const form = this.editTaskForm;
        form.reset();
        form.taskTitle.value = task.titulo;
        form.taskDetail.value = task.descripcion;
        form.taskStatus.value = task.estado;

        const submitHandler = async (e) => {
            e.preventDefault();
            await this.handleTaskUpdate(task, form);
            this.editTaskDialog.close();
            form.removeEventListener('submit', submitHandler);
        };

        form.addEventListener('submit', submitHandler);
        this.editTaskDialog.showModal();
    }

    async loadTasks() {
        try {
            const response = await fetch(this.API_URL);
            this.tasks = await response.json();
            this.renderTasks();
        } catch (error) {
            console.error('Error al cargar las tareas:', error);
        }
    }

    async handleNewTaskSubmit() {
        const formData = new FormData(this.newTaskForm);
        const newTask = {
            titulo: formData.get('taskTitle'),
            descripcion: formData.get('taskDetail'),
            estado: formData.get('taskStatus'),
            fechacreacion: new Date().toISOString(),
            fechaconclusion: ""
        };

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });

            if (response.ok) {
                this.newTaskForm.reset();
                this.newTaskDialog.close();
                await this.loadTasks();
            }
        } catch (error) {
            console.error('Error al crear la tarea:', error);
        }
    }

    async handleTaskUpdate(task, form) {
        const formData = new FormData(form);
        const updatedTask = {
            ...task,
            titulo: formData.get('taskTitle'),
            descripcion: formData.get('taskDetail'),
            estado: formData.get('taskStatus'),
            fechaconclusion: formData.get('taskStatus') === 'completada' ? 
                new Date().toISOString() : ""
        };

        try {
            const response = await fetch(`${this.API_URL}/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTask)
            });

            if (response.ok) {
                await this.loadTasks();
            }
        } catch (error) {
            console.error('Error al actualizar la tarea:', error);
        }
    }

    async deleteTask(taskId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            try {
                const response = await fetch(`${this.API_URL}/${taskId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    await this.loadTasks();
                }
            } catch (error) {
                console.error('Error al eliminar la tarea:', error);
            }
        }
    }


    renderTasks(tasksToRender = this.tasks) {
        this.taskContainer.innerHTML = '';
        const sortedTasks = tasksToRender.sort((a, b) => {
            if (a.estado === 'completada' && b.estado !== 'completada') return 1;
            if (a.estado !== 'completada' && b.estado !== 'completada') return -1;
            return new Date(b.fechacreacion) - new Date(a.fechacreacion);
        });

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskContainer.appendChild(taskElement);
        });
    }

    filterTasksByStatus(status) {
        const tasksToRender = status === 'all' ?
            this.tasks :
            this.tasks.filter(task => task.estado === status);
        this.renderTasks(tasksToRender);
    }

    loadConfig() {
        const savedConfig = localStorage.getItem('taskConfig');
        this.config = savedConfig ? JSON.parse(savedConfig) : {
            language: 'es-ES',
            rate: 1
        };
    }

    saveConfig(newConfig) {
        this.config = newConfig;
        localStorage.setItem('taskConfig', JSON.stringify(newConfig));
    }

    speakTask(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.config.language;
        utterance.rate = this.config.rate;
        speechSynthesis.speak(utterance);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TaskManagement();
});