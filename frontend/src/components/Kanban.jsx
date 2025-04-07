import React, { useEffect, useState } from "react";
import axios from "axios";

export default function KanbanBoard() {
  const [boards, setBoards] = useState([]);
  const [columns, setColumns] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [targetColumn, setTargetColumn] = useState("todo");
  const [newBoardName, setNewBoardName] = useState("");
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [selectedBoardIndex, setSelectedBoardIndex] = useState(0);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);
  const [droppedOnColumn, setDroppedOnColumn] = useState(null);

  const api = "http://localhost:4000";

  useEffect(() => {
    axios.get(`${api}/boards`).then((res) => {
      setBoards(res.data);
    });
  }, []);

  useEffect(() => {
    if (boards.length > 0) {
      const boardId = boards[selectedBoardIndex]?.id;
      axios.get(`${api}/boards/${boardId}/tasks`).then((res) => {
        const newColumns = {
          todo: { title: "TODO", tasks: [] },
          doing: { title: "DOING", tasks: [] },
          done: { title: "DONE", tasks: [] },
        };
        res.data.forEach((task) => {
          const col = task.column;
          if (!newColumns[col]) {
            newColumns[col] = { title: col.toUpperCase(), tasks: [] };
          }
          newColumns[col].tasks.push({ id: task.id, content: task.content });
        });
        setColumns(newColumns);
      });
    }
  }, [selectedBoardIndex, boards]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const boardId = boards[selectedBoardIndex]?.id;
    axios
      .post(`${api}/tasks`, {
        board_id: boardId,
        column: targetColumn,
        content: newTask.trim(),
      })
      .then(() => {
        setNewTask("");
        setIsModalOpen(false);
        setSelectedBoardIndex(selectedBoardIndex); // triggers reload
      });
  };

  const handleAddBoard = () => {
    if (!newBoardName.trim()) return;
    axios.post(`${api}/boards`, { name: newBoardName.trim() }).then((res) => {
      setBoards([...boards, res.data]);
      setNewBoardName("");
      setIsBoardModalOpen(false);
    });
  };

  const handleDeleteTask = (columnKey, taskIndex) => {
    const taskId = columns[columnKey].tasks[taskIndex].id;
    axios.delete(`${api}/tasks/${taskId}`).then(() => {
      const updatedColumns = { ...columns };
      updatedColumns[columnKey].tasks.splice(taskIndex, 1);
      setColumns(updatedColumns);
    });
  };

  const handleDragStart = (e, fromColumn, taskIndex) => {
    const taskId = columns[fromColumn].tasks[taskIndex].id;
    setDraggedTaskId(taskId);
    setDraggedFromColumn(fromColumn);
  };

  const handleDragEnter = (e, toColumn) => {
    setDroppedOnColumn(toColumn);
  };

  const handleDrop = () => {
    if (!draggedTaskId || !draggedFromColumn || !droppedOnColumn) return;

    const draggedTaskIndex = columns[draggedFromColumn].tasks.findIndex(
      (t) => t.id === draggedTaskId
    );

    const task = columns[draggedFromColumn].tasks[draggedTaskIndex];
    if (!task) return;

    const updatedColumns = { ...columns };
    updatedColumns[draggedFromColumn].tasks.splice(draggedTaskIndex, 1);

    if (!updatedColumns[droppedOnColumn]) {
      updatedColumns[droppedOnColumn] = {
        title: droppedOnColumn.toUpperCase(),
        tasks: [],
      };
    }

    updatedColumns[droppedOnColumn].tasks.push(task);
    setColumns(updatedColumns);

    axios
      .put(`${api}/tasks/${draggedTaskId}`, { column: droppedOnColumn })
      .then(() => {
        setDraggedTaskId(null);
        setDraggedFromColumn(null);
        setDroppedOnColumn(null);
      });
  };

  const allowDrop = (e) => e.preventDefault();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 overflow-hidden">
      <div className="flex h-[calc(100vh-2rem)]">
        {/* Sidebar */}
        <aside className="w-1/5 bg-gray-800 rounded-2xl p-4 space-y-4 overflow-y-auto">
          <h2 className="text-xl font-bold">kanban</h2>
          <nav className="space-y-2">
            {boards.map((board, index) => (
              <div
                key={board.id}
                className={`p-2 rounded-xl cursor-pointer ${
                  index === selectedBoardIndex
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:bg-gray-700"
                }`}
                onClick={() => setSelectedBoardIndex(index)}
              >
                {board.name}
              </div>
            ))}
            <div
              className="text-gray-400 p-2 rounded-xl hover:bg-gray-700 cursor-pointer"
              onClick={() => setIsBoardModalOpen(true)}
            >
              + Create New Board
            </div>
          </nav>
          <div className="pt-10 space-y-4">
            <label className="flex items-center gap-2">
              <span className="text-sm">Dark Mode</span>
              <input type="checkbox" className="toggle toggle-sm" defaultChecked />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm">Delete Mode</span>
              <input
                type="checkbox"
                checked={isDeleteMode}
                onChange={() => setIsDeleteMode(!isDeleteMode)}
                className="toggle toggle-sm"
              />
            </label>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-auto pl-4">
          <div className="flex justify-between items-center mb-6 min-w-[600px]">
            <h1 className="text-2xl font-semibold">
              {boards[selectedBoardIndex]?.name || "Loading..."}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl"
              >
                + Add New Task
              </button>
              <button
                onClick={() => setIsBoardModalOpen(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl"
              >
                + Add New Board
              </button>
            </div>
          </div>

          <div className="flex gap-6 min-w-[1000px]">
            {Object.entries(columns).map(([key, column]) => (
              <div
                key={key}
                className="bg-gray-800 rounded-2xl p-4 w-72 flex-shrink-0"
                onDragOver={allowDrop}
                onDragEnter={(e) => handleDragEnter(e, key)}
                onDrop={handleDrop}
              >
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                  <h2 className="text-lg font-bold">
                    {column.title} ({column.tasks.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {column.tasks.map((task, i) => (
                    <div
                      key={task.id}
                      className="bg-gray-700 p-4 rounded-xl text-sm text-white cursor-move flex justify-between items-center"
                      draggable
                      onDragStart={(e) => handleDragStart(e, key, i)}
                    >
                      <span className="w-full whitespace-pre-wrap break-words">
                        {task.content}
                      </span>
                      {isDeleteMode && (
                        <button
                          className="text-red-400 hover:text-red-600 ml-2"
                          onClick={() => handleDeleteTask(key, i)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96 space-y-4">
            <h2 className="text-xl font-semibold">Add New Task</h2>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none"
              placeholder="Task description"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none"
            >
              {Object.keys(columns).map((key) => (
                <option key={key} value={key}>
                  {columns[key].title}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Board Modal */}
      {isBoardModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96 space-y-4">
            <h2 className="text-xl font-semibold">Create New Board</h2>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBoardModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBoard}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500"
              >
                Add Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
