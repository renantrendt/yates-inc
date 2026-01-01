'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMail } from '@/contexts/MailContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types';
import CatEasterEgg from '@/components/CatEasterEgg';


export default function Home() {
  const { employee, isLoggedIn } = useAuth();
  const { createConversation } = useMail();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    task_name: '',
    description: '',
    assigned_to_id: '',
    assigned_to_name: '',
    due_date: '',
  });
  const [client, setClient] = useState<any>(null);

  const isCEO = employee?.id === '000001';

  // Check if client is logged in
  useEffect(() => {
    const savedClient = localStorage.getItem('yates-client');
    if (savedClient) {
      setClient(JSON.parse(savedClient));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
    }
  }, [isLoggedIn]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (data) {
      setTasks(data);
    }
  };

  const updateProgress = async (taskId: string, newProgress: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !employee) return;

    // Only assigned employee can update progress
    if (task.assigned_to_id !== employee.id) return;

    // Can only increase progress
    if (newProgress <= task.progress_percentage) return;

    const { error } = await supabase
      .from('tasks')
      .update({ progress_percentage: newProgress })
      .eq('id', taskId);

    if (!error) {
      // If task reaches 100%, auto-delete and send message to Logan
      if (newProgress === 100) {
        // Delete the task
        await supabase.from('tasks').delete().eq('id', taskId);

        // Send message to Logan (CEO)
        const message = `Task "${task.task_name}" has been completed by ${employee.name} and automatically removed.`;
        await createConversation(
          `Task Completed: ${task.task_name}`,
          ['000001', employee.id], // Logan and the employee
          message,
          employee.id,
          'high' // High priority for task completion
        );
      }

      fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isCEO) return;

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (!error) {
      fetchTasks();
    }
  };

  const updateDueDate = async (taskId: string, newDate: string) => {
    if (!isCEO) return;

    const { error } = await supabase
      .from('tasks')
      .update({ due_date: newDate })
      .eq('id', taskId);

    if (!error) {
      fetchTasks();
    }
  };

  const addTask = async () => {
    if (!isCEO || !employee) return;

    const { error } = await supabase.from('tasks').insert([
      {
        task_name: newTask.task_name,
        description: newTask.description,
        assigned_to_id: newTask.assigned_to_id,
        assigned_to_name: newTask.assigned_to_name,
        progress_percentage: 0,
        due_date: newTask.due_date,
        created_by_id: employee.id,
      },
    ]);

    if (!error) {
      setShowAddTask(false);
      setNewTask({
        task_name: '',
        description: '',
        assigned_to_id: '',
        assigned_to_name: '',
        due_date: '',
      });
      fetchTasks();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CatEasterEgg />

      {/* User Indicator - Top Right */}
      {(employee || client) && (
        <div className="fixed top-20 right-2 sm:right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-2 sm:px-4 py-2 sm:py-3 border-2 border-blue-500 max-w-[200px] sm:max-w-none">
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
            Logged in as:
          </div>
          {employee ? (
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {employee.name}
              </div>
              <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 truncate">
                {employee.role}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                @{client?.username}
              </div>
              <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 truncate">
                Client • {client?.mail_handle}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">Welcome to Yates Inc.</h1>
          <p className="text-base sm:text-lg md:text-xl max-w-3xl">
            This is a Photoshop company focused mainly on selling photoshop services, and some other random products.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">About Us</h2>
            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
              At Yates Inc., we believe in transparency and innovation.
              Our products come with cutting-edge pricing models that
              truly reflect their value proposition.
            </p>
            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-300 leading-relaxed">
              From custom photoshop services to premium household items,
              we've got everything you need to enhance your lifestyle.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">Why Choose Us?</h2>
            <ul className="space-y-2 sm:space-y-3 text-gray-800 dark:text-gray-300 text-sm sm:text-base md:text-lg">
              <li className="flex items-center"><span className="text-green-600 mr-2 text-lg sm:text-xl">✓</span> Innovative pricing models</li>
              <li className="flex items-center"><span className="text-green-600 mr-2 text-lg sm:text-xl">✓</span> Premium quality products</li>
              <li className="flex items-center"><span className="text-green-600 mr-2 text-lg sm:text-xl">✓</span> Professional service</li>
              <li className="flex items-center"><span className="text-green-600 mr-2 text-lg sm:text-xl">✓</span> Transparent terms and conditions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WTBD Section (Only for logged-in employees) */}
      {isLoggedIn && (
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">WTBD - What To Be Done</h2>
              {isCEO && (
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto touch-manipulation"
                >
                  {showAddTask ? 'Cancel' : 'Add Task'}
                </button>
              )}
            </div>

            {/* Add Task Form (CEO Only) */}
            {showAddTask && isCEO && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg mb-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Task</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={newTask.task_name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, task_name: e.target.value })
                    }
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                    rows={3}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Assigned To ID (e.g., 39187)"
                      value={newTask.assigned_to_id}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assigned_to_id: e.target.value })
                      }
                      className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                    />
                    <input
                      type="text"
                      placeholder="Assigned To Name"
                      value={newTask.assigned_to_name}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assigned_to_name: e.target.value })
                      }
                      className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                    />
                  </div>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, due_date: e.target.value })
                    }
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-white text-sm sm:text-base"
                  />
                  <button
                    onClick={addTask}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm sm:text-base w-full sm:w-auto touch-manipulation"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {tasks.map((task) => {
                const isAssigned = task.assigned_to_id === employee?.id;
                return (
                  <div
                    key={task.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 sm:p-6 rounded-lg shadow border dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white pr-2">{task.task_name}</h3>
                      {isCEO && (
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 p-2 touch-manipulation"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Assigned to:</strong> {task.assigned_to_name}
                    </p>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs sm:text-sm mb-1 text-gray-700 dark:text-gray-300">
                        <span>Progress</span>
                        <span>{task.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 sm:h-4">
                        <div
                          className="bg-blue-600 h-3 sm:h-4 rounded-full transition-all"
                          style={{ width: `${task.progress_percentage}%` }}
                        />
                      </div>
                      {isAssigned && (
                        <input
                          type="range"
                          min={task.progress_percentage}
                          max="100"
                          value={task.progress_percentage}
                          onChange={(e) =>
                            updateProgress(task.id, parseInt(e.target.value))
                          }
                          className="w-full mt-2 touch-manipulation"
                        />
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        <strong>Due:</strong>
                      </span>
                      {isCEO ? (
                        <input
                          type="date"
                          value={task.due_date}
                          onChange={(e) => updateDueDate(task.id, e.target.value)}
                          className="border dark:border-gray-600 rounded px-2 py-1 text-xs sm:text-sm dark:bg-gray-800 dark:text-white"
                        />
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300">{new Date(task.due_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {tasks.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No tasks yet. {isCEO && 'Click "Add Task" to create one!'}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
