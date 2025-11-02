// ===============================
// AI Mock Interview JS (Enhanced)
// ===============================

let recognition;
let currentQuestion = 0;
let answers = [];
let interviewType = "Voice Only";
let faceActive = false;

// Questions by role
const roleQuestions = {
  "Data Scientist": [
    // "Explain a machine learning project you worked on.",
    "What are overfitting and underfitting?",
    "What is the difference between supervised and unsupervised learning?",
    "How do you handle missing data?"
  ],
  "Software Engineer": [
    // "Describe your most challenging project.",
    "What are OOP principles?",
    "How do you ensure code quality?",
    "Explain Agile methodology briefly."
  ],
  "AI/ML Engineer": [
    "What is the difference between AI and ML?",
    "How does a neural network learn?",
    "What is backpropagation?",
    // "How do you evaluate model performance?"
  ]
};

// DOM Elements
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const questionBox = document.getElementById("question");
const feedbackBox = document.getElementById("feedback");
const roleSelect = document.getElementById("roleSelect");
const typeSelect = document.getElementById("typeSelect");
const transcriptBox = document.getElementById("transcript");
const video = document.getElementById("video");

// ============ SPEECH RECOGNITION ============
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.onresult = function (event) {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    transcriptBox.innerText = transcript;
  };
} else {
  alert("⚠️ Your browser doesn’t support Speech Recognition.");
}

// ============ FACE DETECTION ============
async function startFaceVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    faceActive = true;

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/static/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/static/models")
    ]);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.getElementById("video-container").append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (!faceActive) return;
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 1000);
  } catch (err) {
    console.error(err);
    alert("Please allow camera access!");
  }
}

// Auto camera on if Face + Voice selected
typeSelect.addEventListener("change", async () => {
  interviewType = typeSelect.value;
  resetInterview();
  if (interviewType === "Face + Voice") {
    await startFaceVideo();
  } else {
    faceActive = false;
    const stream = video.srcObject;
    if (stream) stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
});

// ============ INTERVIEW FLOW ============
function resetInterview() {
  if (recognition) recognition.stop();
  answers = [];
  currentQuestion = 0;
  questionBox.innerText = "Click “Start Interview” to begin!";
  transcriptBox.innerText = "";
  feedbackBox.innerHTML = "";
  startBtn.style.display = "inline-block";
  submitBtn.style.display = "none";
  nextBtn.style.display = "none";
}

startBtn.addEventListener("click", () => {
  const selectedRole = roleSelect.value;
  questions = roleQuestions[selectedRole];
  currentQuestion = 0;
  answers = [];

  questionBox.innerText = questions[currentQuestion];
  transcriptBox.innerText = "";
  feedbackBox.innerHTML = "";
  startBtn.style.display = "none";
  submitBtn.style.display = "inline-block";

  recognition.start();
});

submitBtn.addEventListener("click", () => {
  recognition.stop();
  const answer = transcriptBox.innerText.trim();
  if (answer.length < 3) {
    alert("Please speak your answer first!");
    return;
  }
  answers.push(answer);
  submitBtn.style.display = "none";
  nextBtn.style.display = "inline-block";
});

nextBtn.addEventListener("click", async () => {
  currentQuestion++;
  const selectedRole = roleSelect.value;
  questions = roleQuestions[selectedRole];

  if (currentQuestion < questions.length) {
    questionBox.innerText = questions[currentQuestion];
    transcriptBox.innerText = "";
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
    recognition.start();
  } else {
    questionBox.innerText = "Analyzing your responses...";
    nextBtn.style.display = "none";
    await sendFinalFeedback();
  }
});



// ============ FEEDBACK (Dummy Backend) ============
async function sendFinalFeedback() {
  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: roleSelect.value,
      type: interviewType,
      answers: answers
    })
  })
    .then(res => res.json())
    .then(data => { 
  // Clear the answer/response box completely
  const answerBox = document.getElementById("answerBox");
  if (answerBox) {
    answerBox.style.display = "none"; // hides the box
  }

  // Show interview completed message and thank you note
  questionBox.innerHTML = `
    <div style="
      background-color:#f0fdf4; 
      padding:15px; 
      border-radius:10px; 
      margin-top:10px; 
      text-align:center;
    ">
      <h3 style="color:#16a34a; margin:0;">Thank you for completing the interview!</h3>
      <p style="font-size:15px; margin-top:5px;">We appreciate your time and effort 👏</p>
    </div>
  `;

  // Final feedback section
  feedbackBox.innerHTML = `
    <h3>Final Feedback</h3>
    <p><b>Pitch:</b> ${data.pitch}</p>
    <p><b>Confidence:</b> ${data.confidence}</p>
    <p><b>Nervousness:</b> ${data.nervousness}</p>
    <p><b>Summary:</b> ${data.summary}</p>
  `;
})


    .catch(err => {
      console.error(err);
      feedbackBox.innerHTML = "<p>Error analyzing feedback.</p>";
    });
}
