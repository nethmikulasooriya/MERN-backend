import Student from "../models/student.js";

 export function getstudent(req, res) {
    Student.find().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).json({ error: err.message });
    })
}
//test
 export function saveStudent (req, res) {
    console.log(req.body);

    const student = new Student(req.body);

    student
        .save()
        .then(() => {
            res.json({ message: "Student added successfully" });
        })
        .catch((err) => {
            res.status(500).json({ message: "Failed to add student", error: err.message });
        })
    }