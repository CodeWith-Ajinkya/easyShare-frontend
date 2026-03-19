const API_BASE = "https://easyshare-backend-cidx.onrender.com";

const dropZone = document.getElementById("drop-zone");
const browseBtn = document.getElementById("browseBtn");
const fileInput = document.getElementById("fileInput");

const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressPercent = document.getElementById("progressPercent");

const shareContainer = document.getElementById("shareContainer");
const fileLink = document.getElementById("fileLink");
const copyBtn = document.getElementById("copyBtn");
const copyToast = document.getElementById("copyToast");
const errorToast = document.getElementById("errorToast");

const sendBtn = document.getElementById("sendBtn");
const senderEmail = document.getElementById("senderEmail");
const receiverEmail = document.getElementById("receiverEmail");

const loginModal = document.getElementById("loginModal");
const loginTrigger = document.getElementById("loginTrigger");

const signupCard = document.getElementById("signupCard");
const signupBtn = document.getElementById("signupBtn");
const signupEmail = document.getElementById("signupEmail");
const signupPass = document.getElementById("signupPass");

const loginCard = document.getElementById("loginCard");
const loginBtn = document.getElementById("loginBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");

const toLogin = document.getElementById("toLogin");
const toSignup = document.getElementById("toSignup");

function mustLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const uploadCount = parseInt(localStorage.getItem("uploadCount") || "0");
    
    // Only compulsory if they've already uploaded at least one file and haven't logged in
    return !isLoggedIn && uploadCount >= 1;
}

function updateAuthUI() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const loginTrigger = document.getElementById("loginTrigger");
    
    const userSVG = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>`;

    if (isLoggedIn) {
        loginTrigger.innerHTML = `
            <div class="user-profile logged-in">
                ${userSVG}
                <div class="user-menu">
                    <button id="logoutBtn">Logout</button>
                </div>
            </div>
        `;
        document.getElementById("logoutBtn").addEventListener("click", logout);
    } else {
        loginTrigger.innerHTML = userSVG;
    }
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    updateAuthUI();
    alert("Logged out successfully.");
}

let uploadedUUID = null;

/* ERROR TOAST */
function showError(msg) {
    errorToast.innerText = msg;
    errorToast.classList.add("show");
    setTimeout(() => errorToast.classList.remove("show"), 2000);
}

/* BROWSE CLICK */
browseBtn.addEventListener("click", () => {
    if (mustLogin()) {
        openAuthModal();
        return;
    }
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;
    uploadFile(fileInput.files[0]);
});

/* DRAG EVENTS */
dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-active");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-active");
});

dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-active");

    if (mustLogin()) {
        openAuthModal();
        return;
    }

    if (e.dataTransfer.files.length > 1)
        return showError("Only single file allowed!");

    uploadFile(e.dataTransfer.files[0]);
});

/* UPLOAD FILE */
function uploadFile(file) {

    if (mustLogin()) {
        openAuthModal();
        fileInput.value = "";
        return;
    }

    // Hide dropzone during upload/result
    dropZone.style.display = "none";
    progressContainer.style.display = "block";
    shareContainer.style.display = "none";

    progressFill.style.width = "0%";
    progressPercent.innerText = "0%";

    const formData = new FormData();
    formData.append("myfile", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/files`);

    xhr.upload.onprogress = e => {
        if (!e.lengthComputable) return;
        const percent = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = percent + "%";
        progressPercent.innerText = percent + "%";
    };

    xhr.onload = () => {
        if (xhr.status !== 200) {
            progressContainer.style.display = "none";
            showError("Upload failed!");
            dropZone.style.display = "flex";
            return;
        }

        // Ensure progress shows 100% before hiding
        progressFill.style.width = "100%";
        progressPercent.innerText = "100%";

        setTimeout(() => {
            progressContainer.style.display = "none";
            let res;
            try {
                res = JSON.parse(xhr.responseText);
            } catch {
                dropZone.style.display = "flex";
                return showError("Invalid server response!");
            }

            if (!res.file || !res.uuid) {
                dropZone.style.display = "flex";
                return showError("Server missing required fields!");
            }

            fileLink.value = res.file;
            uploadedUUID = res.uuid;

            // Increment upload count
            const currentCount = parseInt(localStorage.getItem("uploadCount") || "0");
            localStorage.setItem("uploadCount", currentCount + 1);

            shareContainer.style.display = "flex";
            fileInput.value = "";
        }, 1000); // 1s delay for visual completion (100% progress)
    };

    xhr.onerror = () => {
        progressContainer.style.display = "none";
        dropZone.style.display = "flex";
        showError("Cannot connect to server! Please check your internet connection.");
    };

    xhr.ontimeout = () => {
        progressContainer.style.display = "none";
        dropZone.style.display = "flex";
        showError("Upload timed out! Please try again.");
    };

    xhr.send(formData);
}

/* UPLOAD ANOTHER (RESET) */
const reloadBtn = document.getElementById("reloadBtn");
reloadBtn.addEventListener("click", () => {
    if (mustLogin()) {
        openAuthModal();
        return;
    }
    
    shareContainer.style.display = "none";
    dropZone.style.display = "flex";
    fileInput.value = "";
    uploadedUUID = null;
    progressFill.style.width = "0%";
    progressPercent.innerText = "0%";
    senderEmail.value = "";
    receiverEmail.value = "";
});


/* COPY LINK */

copyBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(fileLink.value);
        copyToast.classList.add("show");
        setTimeout(() => copyToast.classList.remove("show"), 1500);
    } catch {
        showError("Copy failed!");
    }
});

/* SEND EMAIL */
sendBtn.addEventListener("click", async () => {

    if (!uploadedUUID)
        return showError("Upload file first!");

    if (!senderEmail.value || !receiverEmail.value)
        return showError("Enter both emails!");

    // Disable button and show loading state
    sendBtn.disabled = true;
    const originalBtnText = sendBtn.innerText;
    sendBtn.innerText = "Sending...";
    sendBtn.style.opacity = "0.7";

    try {
        console.log("Sending email for UUID:", uploadedUUID);
        const res = await fetch(`${API_BASE}/api/files/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uuid: uploadedUUID,
                emailFrom: senderEmail.value,
                emailTo: receiverEmail.value
            })
        });

        // Log response for debugging
        console.log("Email server responded with status:", res.status);
        const data = await res.json();
        console.log("Server data:", data);

        if (!data.success) {
            const errorMsg = data.error || "Email failed!";
            showError(errorMsg);
        } else {
            alert("Email sent successfully!");
        }

    } catch (err) {
        console.error("Email error detail:", err);
        showError("Server not responding! Please try again later.");
    } finally {
        // Re-enable button
        sendBtn.disabled = false;
        sendBtn.innerText = originalBtnText;
        sendBtn.style.opacity = "1";
    }
});

/* DARK MODE LOGIC */
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

// Check local storage
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark-mode");
}

themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    const isDark = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});

/* FAQ ACCORDION */
const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach(question => {
    question.addEventListener("click", () => {
        const item = question.parentElement;
        item.classList.toggle("open");
    });
});

/* LOGIN / SIGNUP MODAL LOGIC */
function openAuthModal() {
    loginModal.classList.add("show");
    
    // If not logged in, ensure we show login card (default)
    if (mustLogin()) {
        showLogin(); 
    }
}

loginTrigger.addEventListener("click", openAuthModal);

// COMPULSORY CHECK ON LOAD
window.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    if (mustLogin()) {
        setTimeout(openAuthModal, 500); 
    }
});

function showLogin() {
    signupCard.style.display = "none";
    loginCard.style.display = "block";
}

function showSignup() {
    loginCard.style.display = "none";
    signupCard.style.display = "block";
}

toLogin.addEventListener("click", (e) => { e.preventDefault(); showLogin(); });
toSignup.addEventListener("click", (e) => { e.preventDefault(); showSignup(); });

/* SIGNUP HANDLING */
signupBtn.addEventListener("click", () => {
    const email = signupEmail.value;
    const pass = signupPass.value;

    if (!email || !pass) {
        return showError("All fields are required!");
    }

    // Store fake credentials
    localStorage.setItem("fakeAccountEmail", email);
    localStorage.setItem("fakeAccountPass", pass);
    
    alert("Signup successful! Now please login.");
    showLogin();
});

/* LOGIN HANDLING */
loginBtn.addEventListener("click", () => {
    const email = loginEmail.value;
    const pass = loginPass.value;

    const savedEmail = localStorage.getItem("fakeAccountEmail");
    const savedPass = localStorage.getItem("fakeAccountPass");

    if (!email || !pass) {
        return showError("Please enter credentials!");
    }

    if (email === savedEmail && pass === savedPass) {
        // Fake login success
        localStorage.setItem("isLoggedIn", "true");
        loginModal.classList.remove("show");
        updateAuthUI();
        alert("Logged in successfully! You can now share files.");
    } else if (!savedEmail) {
        showError("No account found! Please sign up first.");
        showSignup();
    } else {
        showError("Incorrect details! Please try again.");
    }
});

// Close modal on outside click
loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
        // Only allow closing if logged in
        if (!mustLogin()) {
            loginModal.classList.remove("show");
        } else {
            showError("Login is compulsory to continue!");
        }
    }
});

// Prevent escape key closing modal if login is compulsory
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mustLogin() && loginModal.classList.contains("show")) {
        showError("Please login to continue.");
        e.preventDefault();
    }
});
