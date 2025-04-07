const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// SQLite database setup
const db = new sqlite3.Database("./kanban.db");

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER,
      column TEXT,
      content TEXT,
      FOREIGN KEY(board_id) REFERENCES boards(id)
    )
  `);
});

// Get boards
app.get("/boards", (req, res) => {
  db.all("SELECT * FROM boards", (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// Create board
app.post("/boards", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO boards (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).send(err);
    res.json({ id: this.lastID, name });
  });
});

// Get tasks by board
app.get("/boards/:boardId/tasks", (req, res) => {
  const { boardId } = req.params;
  db.all("SELECT * FROM tasks WHERE board_id = ?", [boardId], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// Add task
app.post("/tasks", (req, res) => {
  const { board_id, column, content } = req.body;
  db.run(
    "INSERT INTO tasks (board_id, column, content) VALUES (?, ?, ?)",
    [board_id, column, content],
    function (err) {
      if (err) return res.status(500).send(err);
      res.json({ id: this.lastID, board_id, column, content });
    }
  );
});

// Update task column
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { column } = req.body;
  db.run("UPDATE tasks SET column = ? WHERE id = ?", [column, id], function (err) {
    if (err) return res.status(500).send(err);
    res.json({ updated: this.changes });
  });
});

// Delete task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).send(err);
    res.json({ deleted: this.changes });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
