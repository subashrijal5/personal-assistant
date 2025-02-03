import { ToolInvocation } from "ai";
import { format } from "date-fns";
import { CheckSquare, Calendar, AlertCircle, ListTodo, Loader2 } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: string;
  completed?: string;
}

interface TaskList {
  id: string;
  title: string;
}

export default function Task({
  toolInvocation
}: {
  toolInvocation: ToolInvocation;
}) {

  if (!toolInvocation.state || toolInvocation.state !== "result") {
    return <div>Loading...</div>;
  }

  const isCreate = toolInvocation.toolName === "createTask";
  const isList = toolInvocation.toolName === "listTasks";
  const isCreateList = toolInvocation.toolName === "createTaskList";

  let content;

  if (isCreate && toolInvocation.result?.task) {
    const task = toolInvocation.result.task as Task;
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <CheckSquare className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Task Created</h2>
        </div>
        <TaskCard task={task} />
      </div>
    );
  } else if (isList && Array.isArray(toolInvocation.result)) {
    const tasks = toolInvocation.result as Task[];
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ListTodo className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Your Tasks</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-gray-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            No tasks found
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} listId={toolInvocation.args?.listId} />
            ))}
          </div>
        )}
      </div>
    );
  } else if (isCreateList && toolInvocation.result?.taskList) {
    const taskList = toolInvocation.result.taskList as TaskList;
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ListTodo className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Task List Created</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h3 className="font-medium text-gray-900">{taskList.title}</h3>
          <p className="mt-2 text-sm text-gray-600">
            Task list created successfully. You can now add tasks to this list.
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center justify-center p-6 text-gray-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        No task data available
      </div>
    );
  }

  return <div className="p-4">{content}</div>;
}

function TaskCard({ task, listId }: { task: Task; listId?: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(task.status);

  const toggleStatus = async () => {
    try {
      setIsUpdating(true);
      const newStatus = status === "completed" ? "needsAction" : "completed";
      
      const response = await fetch("/api/tasks/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          listId: listId,
          completed: newStatus === "completed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      setStatus(newStatus);
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow ${
        status === "completed" ? "bg-gray-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium ${
              status === "completed"
                ? "text-gray-500 line-through"
                : "text-gray-900"
            }`}
          >
            {task.title}
          </h3>
          {task.notes && (
            <p className="mt-1 text-sm text-gray-600">{task.notes}</p>
          )}
          {task.due && (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {format(new Date(task.due), "MMM d, yyyy")}
            </div>
          )}
        </div>
        <button
          onClick={toggleStatus}
          disabled={isUpdating}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            isUpdating
              ? "border-gray-300 bg-gray-100"
              : status === "completed"
              ? "bg-green-500 border-green-500 hover:bg-green-600"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
          ) : status === "completed" ? (
            <CheckSquare className="w-3 h-3 text-white" />
          ) : null}
        </button>
      </div>
    </div>
  );
}
