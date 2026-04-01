# Smart Student Manager

A lightweight student management web app built with HTML, CSS, and JavaScript, backed by Firebase Firestore.

## 🌐 What this website does

- Add student records (Name, Age, Course).
- View all students in a table.
- Edit student records (in-place form update).
- Delete student records with confirmation.
- Search student records instantly by name/age/course.
- Real-time database sync using Firebase Firestore snapshot listener.
- Export current record set to CSV.
- Dashboard stats: total students, average age, course count.
- Light/Dark theme toggle saved in `localStorage`.

## 🧩 Tech stack

- **HTML**: page structure, forms, table, navigation.
- **CSS**: styling, responsive layout, theming, animation, toast messages.
- **Vanilla JavaScript**: business logic, Firebase CRUD, UI updates.
- **Firebase Firestore**: backend NoSQL database with realtime updates.
- **Google Fonts / Font Awesome**: improved UI icons and typography.

## 🗂️ Files

- `index.html`: UI markup and layout.
- `style.css`: CSS theme, components, responsive design.
- `app.js`: app logic, Firestore CRUD, filtering, stats, toast, export.
- `README.md`: this documentation.

## 🔌 Firebase database details

- Uses **Firebase JS compat** scripts:
  - `firebase-app-compat.js`
  - `firebase-firestore-compat.js`
- Firestore collection: `students`
- Document fields:
  - `name` (string)
  - `age` (number)
  - `course` (string)
  - `createdAt` (server timestamp)

### Data flow

1. On load: `getStudents()` registers real-time `onSnapshot` listener.
2. Any added/updated/deleted student updates Firestore immediately.
3. Snapshot callback re-renders table and updates stats automatically.

## 🚀 Install and run

1. Clone repository.
2. Open `index.html` in browser.
3. Ensure internet connection for Firebase CDN and Font Awesome.

## ✔️ Key functions

- `navigateTo(pageId)` — switches visible section.
- `addStudent()` — validates and creates a student doc.
- `updateStudent(id)` — validates and updates a doc.
- `deleteStudent(id)` — confirms and deletes a doc.
- `applyFilter(query)` — searches table rows client-side.
- `updateStats()` — computes total, average age, course count.
- `exportStudentsToCsv(data)` — downloads CSV file.
- `showToast(message, type)` — UI feedback.

## 💡 Future improvements

- Login/auth with Firebase Authentication.
- Sorting and pagination in the table.
- Course categories and tags.
- Form field UX enhancements (error messages near fields).
- Graphs for age distribution, course trends.

## 🧾 About author

- Arya Rewatkar
- USN: CM24073
- Subject: DBMS

---

### Notes on database for assignment

- This project demonstrates database CRUD and real-time updates.
- Firestore is favored for modern web apps and easy deployment.
- Data is stored as documents; each student record is a document.
- Indexing and queries are covered by Firestore default index for the simple collection.
