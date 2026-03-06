import express from "express";
import cors from "cors";
import fs from "fs/promises";
import { Assignment, Member } from "./types";

export const app = express();

app.use(express.json());
app.use(cors());

const MEMBERS_PATH = "./public/members.json";
const ASSIGNMENTS_PATH = "./public/assignments.json";

// Hjälpfunktion för att läsa JSON
async function readAssignments(): Promise<Assignment[]> {
  const data = await fs.readFile(ASSIGNMENTS_PATH, "utf-8");
  return JSON.parse(data);
}

async function readMember(): Promise<Member[]> {
  const data = await fs.readFile(MEMBERS_PATH, "utf-8");
  return JSON.parse(data);
}

// Hjälpfunktion för att skriva JSON
async function writeJSON(path: string, data: Assignment[] | Member[]) {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
}

app.get("/members", async (req, res) => {
  const members = await readMember();
  res.json(members);
});

app.post("/members", async (req, res) => {
  const members = await readMember();
  const newMember = { ...req.body, id: crypto.randomUUID() }; // string
  members.push(newMember);
  await writeJSON(MEMBERS_PATH, members);
  res.json(newMember);
});

app.get("/assignments", async (req, res) => {
  const assignments = await readAssignments();
  res.json(assignments);
});

app.get("/assignments/:id", async (req, res) => {
  const assignments = await readAssignments();
  const id = req.params.id; // behåll som string
  const assignment = assignments.find((a) => a.id === id);
  if (!assignment)
    return res.status(404).json({ message: "Assignment not found" });
  res.json(assignment);
});

app.post("/assignments", async (req, res) => {
  const assignments = await readAssignments();
  const newAssignment = {
    ...req.body,
    id: crypto.randomUUID(), // unikt ID med crypto
     status: "new",                // sätt default status
    timestamp: new Date().toISOString(), //nuvarande tid
  }; 
  assignments.push(newAssignment);
  await writeJSON(ASSIGNMENTS_PATH, assignments);
  res.json(newAssignment);
});

// Assign task
app.patch("/assignments/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assignedId, assignedTo } = req.body;

  if (!assignedId || !assignedTo) {
    return res
      .status(400)
      .json({ message: "assignedId and assignedTo required" });
  }

  try {
    const fileData = await fs.readFile(ASSIGNMENTS_PATH, "utf-8");
    const jsonData = JSON.parse(fileData);

    const assignments = jsonData.assignments || jsonData; //Hanterar två möjliga JSON-format

    const assignment = assignments.find((a: Assignment) => a.id === id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    assignment.assignedId = assignedId;
    assignment.assignedTo = assignedTo;
    assignment.status = "doing";

    // Skriv tillbaka i samma format som filen
    if (jsonData.assignments) {
      jsonData.assignments = assignments;
      await fs.writeFile(ASSIGNMENTS_PATH, JSON.stringify(jsonData, null, 2));
    } else {
      await fs.writeFile(
        ASSIGNMENTS_PATH,
        JSON.stringify(assignments, null, 2),
      );
    }

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/assignments/:id/status", async (req, res) => {
  const { id } = req.params; // sträng
  const { status } = req.body;

  try {
    const assignments = await readAssignments(); 

    if (!Array.isArray(assignments))
      return res.status(500).json({ message: "Invalid assignments format" });

    const assignment = assignments.find((a) => a.id === id);

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    assignment.status = status;

    // Skriv tillbaka i samma format
    await writeJSON(ASSIGNMENTS_PATH, assignments);

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete

app.delete("/assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("DELETE endpoint hit with id:", id);

    const assignments = await readAssignments();


    if (!Array.isArray(assignments)) {
      return res.status(500).json({ message: "Assignments is not an array" });
    }

    const filtered = assignments.filter((a) => a.id !== id);


    await writeJSON(ASSIGNMENTS_PATH, filtered);

    res.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("DELETE error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
