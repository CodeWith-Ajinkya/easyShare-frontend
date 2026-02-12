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
        progressContainer.style.display = "none";

        if (xhr.status !== 200) return showError("Upload failed!");

        let res;

        try {
            res = JSON.parse(xhr.responseText);
        } catch {
            return showError("Invalid server response!");
        }

        if (!res.file || !res.uuid)
            return showError("Server missing required fields!");

        fileLink.value = res.file;
        uploadedUUID = res.uuid;

        shareContainer.style.display = "block";
        fileInput.value = "";
    };

    xhr.onerror = () => {
        progressContainer.style.display = "none";
        showError("Cannot connect to server!");
    };

    xhr.send(formData);
}

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

        if (!data.success)
            return showError("Email failed!");

        alert("Email sent successfully!");

    } catch {
        showError("Server not responding!");
    }
});
