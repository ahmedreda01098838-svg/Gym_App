// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyDNpyyV7b5bNxU0rufLWg22r_sSWhHrvJ0",
  authDomain: "gym-planner-d3266.firebaseapp.com",
  projectId: "gym-planner-d3266",
  storageBucket: "gym-planner-d3266.firebasestorage.app",
  messagingSenderId: "76327803191",
  appId: "1:76327803191:web:6193a54d70f1ce7f6022b2",
  measurementId: "G-CKKVHFPSB9"
};

// تشغيل السيرفر
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let workoutDays = [];
let gymTasks = [];
let timerInterval;

function init() {
    loadCloudData();
}

// جلب البيانات لحظياً من السحابة
function loadCloudData() {
    db.collection("days").onSnapshot((snapshot) => {
        workoutDays = snapshot.docs.map(doc => doc.data().name);
        renderAll();
    });

    db.collection("exercises").onSnapshot((snapshot) => {
        gymTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
    });
}

async function addNewDay() {
    const { value: dayName } = await Swal.fire({
        title: 'اسم اليوم (مثلاً: ظهر وباي)',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'إضافة'
    });
    if (dayName) {
        await db.collection("days").add({ name: dayName });
    }
}

async function handleAddExercise(day) {
    const title = document.getElementById(`input-${day}`).value;
    const weight = document.getElementById(`weight-${day}`).value;
    const sets = document.getElementById(`sets-${day}`).value;
    const reps = document.getElementById(`reps-${day}`).value;

    if (!title) return;

    await db.collection("exercises").add({
        day: day,
        title: title,
        details: `${sets || 0} مجموعات × ${reps || 0} عدات | وزن: ${weight || 0}KG`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById(`input-${day}`).value = "";
}

function renderAll() {
    const container = document.getElementById("week-container");
    container.innerHTML = "";
    workoutDays.forEach(day => {
        const dayCard = document.createElement("div");
        dayCard.className = "day-card";
        dayCard.innerHTML = `
            <div class="card-header">
                <h3>${day}</h3>
                <button onclick="deleteDay('${day}')" class="del-day-btn">حذف</button>
            </div>
            <div class="input-group">
                <input type="text" id="input-${day}" placeholder="تمرين">
                <input type="number" id="weight-${day}" placeholder="وزن">
                <input type="number" id="sets-${day}" placeholder="سيت">
                <input type="number" id="reps-${day}" placeholder="عدات">
                <button onclick="handleAddExercise('${day}')">➕</button>
            </div>
            <ul class="task-list">
                ${gymTasks.filter(t => t.day === day).map(task => `
                    <li class="task-item">
                        <div><strong>${task.title}</strong><div class="task-details">${task.details}</div></div>
                        <button onclick="deleteTask('${task.id}')" style="background:none; border:none; color:red; cursor:pointer;">❌</button>
                    </li>
                `).join('')}
            </ul>
            <div class="timer-control">
                <input type="number" id="time-${day}" value="60">
                <button onclick="startRest('${day}')">بدء راحة</button>
            </div>
        `;
        container.appendChild(dayCard);
    });
}

async function deleteTask(id) {
    await db.collection("exercises").doc(id).delete();
}

async function deleteDay(name) {
    const daySnap = await db.collection("days").where("name", "==", name).get();
    daySnap.forEach(doc => doc.ref.delete());
    const taskSnap = await db.collection("exercises").where("day", "==", name).get();
    taskSnap.forEach(doc => doc.ref.delete());
}

function startRest(day) {
    const sec = document.getElementById(`time-${day}`).value || 60;
    clearInterval(timerInterval);
    let timeLeft = parseInt(sec);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer-display").innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
            Swal.fire('انتهى الوقت!', 'وحش يا بطل 💪', 'success');
        }
    }, 1000);
}

function exportToPDF() {
    const element = document.getElementById('week-container');
    html2pdf().from(element).save('MyGymPlan.pdf');
}