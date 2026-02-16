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

let uploadedUUID = null;

/* ERROR TOAST */
function showError(msg) {
    errorToast.innerText = msg;
    errorToast.classList.add("show");
    setTimeout(() => errorToast.classList.remove("show"), 2000);
}

/* BROWSE CLICK */
browseBtn.addEventListener("click", () => fileInput.click());

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

    if (e.dataTransfer.files.length > 1)
        return showError("Only single file allowed!");

    uploadFile(e.dataTransfer.files[0]);
});

/* UPLOAD FILE */
function uploadFile(file) {

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
            dropZone.style.display = "block";
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
                dropZone.style.display = "block";
                return showError("Invalid server response!");
            }

            if (!res.file || !res.uuid) {
                dropZone.style.display = "block";
                return showError("Server missing required fields!");
            }

            fileLink.value = res.file;
            uploadedUUID = res.uuid;

            shareContainer.style.display = "block";
            fileInput.value = "";
        }, 300); // Short delay for visual completion
    };

    xhr.onerror = () => {
        progressContainer.style.display = "none";
        dropZone.style.display = "block";
        showError("Cannot connect to server! Please check your internet connection.");
    };

    xhr.ontimeout = () => {
        progressContainer.style.display = "none";
        dropZone.style.display = "block";
        showError("Upload timed out! Please try again.");
    };

    xhr.send(formData);
}

/* UPLOAD ANOTHER (RESET) */
const reloadBtn = document.getElementById("reloadBtn");
reloadBtn.addEventListener("click", () => {
    shareContainer.style.display = "none";
    dropZone.style.display = "block";
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
        const res = await fetch(`${API_BASE}/api/files/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uuid: uploadedUUID,
                emailFrom: senderEmail.value,
                emailTo: receiverEmail.value
            })
        });

        const data = await res.json();

        if (!data.success) {
            const errorMsg = data.error || "Email failed!";
            showError(errorMsg);
        } else {
            alert("Email sent successfully!");
        }

    } catch (err) {
        console.error("Email error:", err);
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
