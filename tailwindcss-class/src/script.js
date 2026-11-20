(() => {
        const STORAGE_KEY = 'daymark-tasks-v1';
        const form = document.querySelector('#task-form');
        const input = document.querySelector('#task-input');
        const list = document.querySelector('#task-list');
        const emptyState = document.querySelector('#empty-state');
        const emptyTitle = document.querySelector('#empty-title');
        const emptyCopy = document.querySelector('#empty-copy');
        const countLabel = document.querySelector('#task-count');
        const progressCaption = document.querySelector('#progress-caption');
        const clearCompletedButton = document.querySelector('#clear-completed');
        const formMessage = document.querySelector('#form-message');
        const saveStatus = document.querySelector('#save-status');
        const filterButtons = [...document.querySelectorAll('.filter-button')];
        let activeFilter = 'all';
        let tasks = loadTasks();
        
        
        const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        document.querySelector('#today-date').textContent = dateLabel.format(new Date());

        // load tasks from localStorage and filter out invalid entries
        function loadTasks() {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(saved)) return [];
            return saved.filter((task) => task && typeof task.id === 'string' && typeof task.text === 'string')
              .map((task) => ({ id: task.id, text: task.text.slice(0, 120), completed: Boolean(task.completed) }));
          } catch {
            return [];
          }
        }

        //save tasks to localStorage and update the save status message
        function saveTasks() {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
            if (saveStatus) saveStatus.textContent = 'Saved on this device';
          } catch {
            if (saveStatus) saveStatus.textContent = 'Storage is unavailable in this browser';
          }
        }
         //make a unique task ID using crypto.randomUUID if available, otherwise fallback to a timestamp and random number
        function makeTaskId() {
          return window.crypto && typeof window.crypto.randomUUID === 'function'
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }

        function createTaskRow(task) {
          const row = document.createElement('li');
          row.className = 'group flex min-h-[68px] items-center gap-3 py-3 sm:gap-4';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = task.completed;
          checkbox.setAttribute('aria-label', `Mark “${task.text}” ${task.completed ? 'as active' : 'as completed'}`);
          checkbox.className = 'size-5 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-700 accent-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
          checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            saveTasks();
            render();
          });

          const label = document.createElement('span');
          label.textContent = task.text;
          label.className = `min-w-0 flex-1 break-words text-sm leading-6 transition ${task.completed ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-700'}`;

          const removeButton = document.createElement('button');
          removeButton.type = 'button';
          removeButton.setAttribute('aria-label', `Delete “${task.text}”`);
          removeButton.title = 'Delete task';
          removeButton.className = 'inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100';
          removeButton.innerHTML = '<svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>';
          removeButton.addEventListener('click', () => {
            tasks = tasks.filter((item) => item.id !== task.id);
            saveTasks();
            render();
          });

          row.append(checkbox, label, removeButton);
          return row;
        }

        function render() {
          const completedCount = tasks.filter((task) => task.completed).length;
          const remainingCount = tasks.length - completedCount;
          const visibleTasks = tasks.filter((task) => {
            if (activeFilter === 'active') return !task.completed;
            if (activeFilter === 'completed') return task.completed;
            return true;
          });

          countLabel.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
          progressCaption.textContent = tasks.length === 0
            ? 'Ready when you are'
            : remainingCount === 0 ? 'Everything is done' : `${remainingCount} left to do`;
          clearCompletedButton.classList.toggle('hidden', completedCount === 0);
          filterButtons.forEach((button) => {
            const selected = button.dataset.filter === activeFilter;
            button.setAttribute('aria-pressed', String(selected));
            button.className = `filter-button rounded-lg px-3 py-2 text-xs transition sm:px-3.5 sm:text-sm ${selected ? 'bg-emerald-50 font-semibold text-emerald-800' : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`;
          });

          list.replaceChildren(...visibleTasks.map(createTaskRow));
          const showEmpty = visibleTasks.length === 0;
          emptyState.classList.toggle('hidden', !showEmpty);
          if (tasks.length === 0) {
            emptyTitle.textContent = 'A clear start.';
            emptyCopy.textContent = 'Add your first task to get going.';
          } else if (activeFilter === 'active') {
            emptyTitle.textContent = 'All caught up.';
            emptyCopy.textContent = 'There are no active tasks right now.';
          } else if (activeFilter === 'completed') {
            emptyTitle.textContent = 'Nothing completed yet.';
            emptyCopy.textContent = 'Finished tasks will show up here.';
          }
        }

        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const text = input.value.trim();
          if (!text) {
            formMessage.textContent = 'Add a few words to create a task.';
            formMessage.classList.remove('hidden');
            input.focus();
            return;
          }
          tasks.unshift({ id: makeTaskId(), text: text.slice(0, 120), completed: false });
          activeFilter = 'all';
          saveTasks();
          render();
          input.value = '';
          formMessage.textContent = '';
          formMessage.classList.add('hidden');
          input.focus();
        });

        input.addEventListener('input', () => {
          if (input.value.trim()) formMessage.classList.add('hidden');
        });

        filterButtons.forEach((button) => {
          button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;
            render();
          });
        });

        clearCompletedButton.addEventListener('click', () => {
          tasks = tasks.filter((task) => !task.completed);
          if (activeFilter === 'completed') activeFilter = 'all';
          saveTasks();
          render();
        });

        render();
      })();
  
