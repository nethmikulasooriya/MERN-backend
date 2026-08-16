import express from "express";
//import Student from "../models/student.js";
import { getstudent, saveStudent } from "../controllers/studentController.js";

const studentRouter = express.Router();

// GET: Fetch all students
studentRouter.get("/", getstudent);

// POST: Add a new student
studentRouter.post("/", saveStudent);



export default studentRouter;