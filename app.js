// 1. Firebase Setup: Initialize Application and Firestore
const firebaseConfig = {
    apiKey: "AIzaSyBshWdZ4HEW2DxhiWvXHynGUg8xnST0czc",
    authDomain: "smart-student-manager-b2adc.firebaseapp.com",
    projectId: "smart-student-manager-b2adc",
    storageBucket: "smart-student-manager-b2adc.firebasestorage.app",
    messagingSenderId: "994360339248",
    appId: "1:994360339248:web:2b35bf0e6fb3279febb6f5"
};

// Initialize Firebase using compat syntax compatible with the normal script tags 
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Application State Tracking
let students = []; // Retained to lookup student details quickly during Edit
let currentScreen = 'home-page';
let editingId = null;

// DOM Elements
const tableBody = document.getElementById('students-table-body');
const form = document.getElementById('add-student-form');
const nameInput = document.getElementById('student-name');
const ageInput = document.getElementById('student-age');
const courseInput = document.getElementById('student-course');
const searchInput = document.getElementById('student-search');
const toastEl = document.getElementById('toast');
const themeToggleBtn = document.getElementById('theme-toggle');
const exportCsvBtn = document.getElementById('export-csv');
const statTotalStudents = document.getElementById('stat-total-students');
const statAverageAge = document.getElementById('stat-average-age');
const statCourseCount = document.getElementById('stat-course-count');
const addTitle = document.querySelector('#add-page .page-header h2');
const submitBtn = document.querySelector('#add-student-form button[type="submit"]');

function setTheme(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    themeToggleBtn.innerText = mode === 'dark' ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('ssmTheme', mode);
}

function initTheme() {
    const saved = localStorage.getItem('ssmTheme');
    const preferred = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
}

themeToggleBtn?.addEventListener('click', toggleTheme);
initTheme();

exportCsvBtn?.addEventListener('click', () => exportStudentsToCsv(students));

// Handle Navigation visually
function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    currentScreen = pageId;

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = Array.from(document.querySelectorAll('.nav-link')).find(link => 
        link.getAttribute('onclick').includes(pageId)
    );
    if (activeLink) activeLink.classList.add('active');

    if (pageId === 'add-page' && !editingId) resetForm();
}

// Form Event Dispatcher
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true; // Prevent multiple requests

    if (editingId) {
        await updateStudent(editingId); // 5. Call update document logic
    } else {
        await addStudent(); // 2. Call create document logic
    }
    
    submitBtn.disabled = false;
});

searchInput?.addEventListener('input', () => {
    const filter = searchInput.value.trim().toLowerCase();
    applyFilter(filter);
});

// 2. Add Student (Create Document)
async function addStudent() {
    const name = nameInput.value.trim();
    const age = parseInt(ageInput.value);
    const course = courseInput.value.trim();

    if (!name || isNaN(age) || !course || age <= 1 || age > 120) {
        showToast('Please fill valid name and age (2-120), and course.', 'error');
        return;
    }

    try {
        await db.collection("students").add({
            name: name,
            age: age,
            course: course,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() // optional safe ordering field
        });
        
        showToast('Student added successfully.', 'success');
        showSuccessAndRedirect('Student Added!');
    } catch (error) {
        console.error("Error adding student:", error);
        showToast('Failed to add student. Try again.', 'error');
    }
}

// 3. Get Students (Read Documents + Real-Time Snapshot)
function getStudents() {
    db.collection("students").onSnapshot((querySnapshot) => {
        students = [];
        tableBody.innerHTML = '';

        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">No student records found in Database.</td>
                </tr>
            `;
            students = [];
            updateStats();
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            students.push({ id, ...data });

            const tr = document.createElement('tr');
            tr.dataset.studentId = id;
            tr.dataset.name = data.name || '';
            tr.dataset.age = String(data.age || '');
            tr.dataset.course = data.course || '';
            tr.innerHTML = `
                <td style="font-weight: 500;">${data.name}</td>
                <td>${data.age}</td>
                <td>${data.course}</td>
                <td class="action-buttons">
                    <button class="btn btn-secondary" onclick="editStudentInit('${id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteStudent('${id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        updateStats();
        applyFilter(searchInput?.value || '');
    }, (error) => {
        console.error("Real-time listener failed:", error);
    });
}

// Helper to push values into form UI before update
function editStudentInit(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    nameInput.value = student.name;
    ageInput.value = student.age;
    courseInput.value = student.course;

    editingId = id;
    addTitle.innerText = 'Edit Student Record';
    submitBtn.innerText = 'Save Changes';

    navigateTo('add-page');
}

// 5. Update Student (Modify Active Document)
async function updateStudent(id) {
    const name = nameInput.value.trim();
    const age = parseInt(ageInput.value);
    const course = courseInput.value.trim();

    if (!name || isNaN(age) || !course || age <= 1 || age > 120) {
        showToast('Please fill valid name and age (2-120), and course.', 'error');
        return;
    }

    try {
        await db.collection("students").doc(id).update({
            name: name,
            age: age,
            course: course
        });
        
        showSuccessAndRedirect('Updated successfully!');
    } catch (error) {
        console.error("Error updating student:", error);
        showToast('Update failed. Please try again.', 'error');
    }
}

function applyFilter(query) {
    const normalized = query.trim().toLowerCase();
    const rows = tableBody.querySelectorAll('tr[data-student-id]');

    rows.forEach(row => {
        const name = row.dataset.name?.toLowerCase() || '';
        const age = row.dataset.age?.toLowerCase() || '';
        const course = row.dataset.course?.toLowerCase() || '';
        const text = `${name} ${age} ${course}`;
        row.style.display = normalized === '' || text.includes(normalized) ? '' : 'none';
    });
}

function showToast(message, type = 'success') {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
        toastEl.className = 'toast';
    }, 1900);
}

function updateStats() {
    const total = students.length;
    const validAges = students
        .map(s => Number(s.age))
        .filter(age => !isNaN(age) && age > 0 && age < 130);

    const average = validAges.length ? (validAges.reduce((a, b) => a + b, 0) / validAges.length) : 0;
    const median = validAges.length ? (() => {
        const sorted = [...validAges].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    })() : 0;

    const courses = new Set(students.map(s => (s.course || '').toLowerCase()).filter(Boolean));

    if (statTotalStudents) statTotalStudents.querySelector('p').textContent = total;
    if (statAverageAge) statAverageAge.querySelector('p').textContent = validAges.length ? average.toFixed(1) : 'N/A';
    if (statCourseCount) statCourseCount.querySelector('p').textContent = courses.size;

    // Set helper title showing median and data quality
    if (statAverageAge) {
        statAverageAge.title = validAges.length ? `Median: ${median.toFixed(1)}, min: ${Math.min(...validAges)}, max: ${Math.max(...validAges)}` : 'No valid age data';
    }
}

function exportStudentsToCsv(data) {
    if (!data || !data.length) {
        showToast('No students to export.', 'error');
        return;
    }

    const rows = [ ['Name', 'Age', 'Course'] ];
    data.forEach(s => rows.push([s.name || '', s.age || '', s.course || '']));

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported CSV successfully.', 'success');
}

// 4. Delete Student (Remove Document)
async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this specific student?')) {
        try {
            await db.collection("students").doc(id).delete();
            showToast('Student deleted.', 'success');
            // Automatically handled by strictly bound onSnapshot
        } catch (error) {
            console.error("Error removing student:", error);
            showToast('Failed to delete student.', 'error');
        }
    }
}

// Visual Success Interactivity Helper
function showSuccessAndRedirect(msg) {
    showToast(msg, 'success');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = msg;
    submitBtn.classList.add('btn-secondary');
    submitBtn.classList.remove('btn-primary');

    setTimeout(() => {
        submitBtn.innerText = 'Add Student';
        submitBtn.classList.remove('btn-secondary');
        submitBtn.classList.add('btn-primary');
        
        resetForm();
        navigateTo('view-page');
    }, 800);
}

// Reset Form Setup
function resetForm() {
    form.reset();
    editingId = null;
    addTitle.innerText = 'Add New Student';
    submitBtn.innerText = 'Add Student';
}

// 8. Boot up Application View Data on Start
getStudents();
