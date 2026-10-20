const SUPABASE_URL = "https://swvnsamzoasocqhyrunu.supabase.co";

const SUPABASE_KEY = "sb_publishable_D4vwmhaWFKRTuojpTlGV6Q_h-OAlAiZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// Check whether Jiju is logged in
async function checkLogin() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.href = "login.html";
        return false;
    }

    const jijuUserId = "4f8f8dca-2559-4b6e-b825-bc950c1d59a9";

    if (data.session.user.id !== jijuUserId) {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return false;
    }

    return true;
}
// Load bookings
async function loadBookings() {

    const bookingsList = document.getElementById("bookingsList");

    const { data, error } = await supabaseClient
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);

        bookingsList.innerHTML =
            "<p class='empty'>Unable to load bookings.</p>";

        return;
    }

    if (!data || data.length === 0) {

        bookingsList.innerHTML =
            "<p class='empty'>No bookings available yet.</p>";

        updateStats([]);

        return;
    }

    bookingsList.innerHTML = "";

    data.forEach(function(booking) {

        const bookingCard = document.createElement("div");

        bookingCard.className = "booking-card";

        bookingCard.innerHTML = `
    <h3>${booking.booking_code}</h3>

    <p><strong>Patient Name:</strong> ${booking.patient_name}</p>
    <p><strong>Mobile:</strong> ${booking.mobile}</p>
    <p><strong>Test:</strong> ${booking.test}</p>
    <p><strong>Preferred Date:</strong> ${booking.preferred_date}</p>
    <p><strong>Sample Collection:</strong> ${booking.sample_collection}</p>

    <p><strong>Additional Information:</strong>
        ${booking.additional_info || "None"}
    </p>

    <p><strong>Status:</strong> ${booking.status}</p>

    <label for="status-${booking.id}">Change Status</label>
    <select id="status-${booking.id}" class="booking-status">
        <option value="Pending" ${booking.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="Confirmed" ${booking.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
        <option value="Completed" ${booking.status === "Completed" ? "selected" : ""}>Completed</option>
    </select>

    <button type="button" class="update-booking-btn"
        data-id="${booking.id}">
        Update Status
    </button>
`;
        bookingsList.appendChild(bookingCard);
        const updateButton = bookingCard.querySelector(".update-booking-btn");

updateButton.addEventListener("click", async function () {
    const statusSelect = bookingCard.querySelector(".booking-status");
    const newStatus = statusSelect.value;

    const { error } = await supabaseClient
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", booking.id);

    if (error) {
        console.error(error);
        alert("Status update nahi hua. Please try again.");
        return;
    }

    alert("Booking status updated successfully!");
    await loadBookings();
});

    });

    updateStats(data);
}


// Update dashboard numbers
function updateStats(bookings) {
    const total = bookings.length;

    const pending = bookings.filter(function(booking) {
        return booking.status === "Pending";
    }).length;

    const confirmed = bookings.filter(function(booking) {
        return booking.status === "Confirmed";
    }).length;

    const completed = bookings.filter(function(booking) {
        return booking.status === "Completed";
    }).length;

    const numbers = document.querySelectorAll(".card .number");

    if (numbers.length >= 4) {
        numbers[0].textContent = total;
        numbers[1].textContent = pending;
        numbers[2].textContent = confirmed;
        numbers[3].textContent = completed;
    }
}

// Start dashboard
// Load saved patient reports
async function loadSavedReports(searchText = "") {
    const reportsList = document.getElementById("savedReportsList");

    reportsList.textContent = "Loading reports...";

    const { data, error } = await supabaseClient
        .from("reports")
        .select("patient_name, patient_id, mobile, report_number, test_name, report_date, file_path")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Reports loading error:", error);
        reportsList.textContent = "Unable to load reports.";
        return;
    }

    const search = searchText.toLowerCase();

   const filteredReports = (data || []).filter(report =>
    (report.patient_name || "").toLowerCase().includes(search) ||
    (report.mobile || "").toLowerCase().includes(search)
);
    reportsList.replaceChildren();

    if (filteredReports.length === 0) {
        reportsList.textContent = "No matching reports found.";
        return;
    }

    filteredReports.forEach(report => {
        const card = document.createElement("div");
        card.style.cssText =
            "border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:8px;";

        const details = [
            ["Patient Name", report.patient_name],
            ["Patient ID", report.patient_id],
            ["Report Number", report.report_number],
            ["Test", report.test_name],
            ["Date", report.report_date || "Not specified"]
        ];

        details.forEach(([label, value]) => {
            const p = document.createElement("p");
            p.textContent = `${label}: ${value}`;
            card.appendChild(p);
        });

       if (report.file_path) {
    const pdfButton = document.createElement("button");
    pdfButton.textContent = "View PDF";

    pdfButton.addEventListener("click", async function () {
        const { data, error } = await supabaseClient.storage
            .from("patient-reports")
            .createSignedUrl(report.file_path, 60);

        if (error) {
            console.error("PDF opening error:", error);
            alert("PDF open nahi hui. Please try again.");
            return;
        }

        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    });

    card.appendChild(pdfButton);
}
        reportsList.appendChild(card);
    });
}
document.getElementById("reportSearch").addEventListener("input", function () {
    loadSavedReports(this.value.trim());
});
async function startDashboard() {

    const loggedIn = await checkLogin();

    if (!loggedIn) {
        return;
    }

    await loadBookings();
    await loadSavedReports();

}
// Preview patient report
document.getElementById("previewReportBtn").addEventListener("click", function() {
    const name = document.getElementById("patientName").value;
    const age = document.getElementById("patientAge").value;
    const gender = document.getElementById("patientGender").value;
    const patientId = document.getElementById("patientId").value;
    const reportNumber = document.getElementById("reportNumber").value;
    const reportDate = document.getElementById("reportDate").value;
    const doctor = document.getElementById("referringDoctor").value;
    const sample = document.getElementById("sampleType").value;
    const test = document.getElementById("testName").value;
    const results = document.getElementById("testResults").value;
    const notes = document.getElementById("reportNotes").value;

    const preview = document.getElementById("reportPreview");
    const content = document.getElementById("previewContent");

    content.textContent =
        "RUMVI PATHOLOGY LAB\n\n" +
        "Patient Name: " + name + "\n" +
        "Age: " + age + "\n" +
        "Gender: " + gender + "\n" +
        "Patient ID: " + patientId + "\n" +
        "Report Number: " + reportNumber + "\n" +
        "Report Date: " + reportDate + "\n" +
        "Referring Doctor: " + doctor + "\n" +
        "Sample Type: " + sample + "\n\n" +
        "Test Name: " + test + "\n\n" +
        "Investigation Results:\n" + results + "\n\n" +
        "Report Notes:\n" + notes;

    preview.style.display = "block";
});
// Save patient report and upload PDF
document.getElementById("saveReportBtn").addEventListener("click", async function () {
    const patientName = document.getElementById("patientName").value.trim();
    const patientId = document.getElementById("patientId").value.trim();
    const reportNumber = document.getElementById("reportNumber").value.trim();
    const testName = document.getElementById("testName").value.trim();
    const mobile = document.getElementById("patientMobile").value.trim();
    const fileInput = document.getElementById("reportFile");
    const file = fileInput.files[0];

    if (!patientName || !patientId || !reportNumber || !testName || !mobile) {
        alert("Please fill Patient Name, Patient ID, Mobile Number, Report Number and Test Name.");
        return;
    }

    if (!file) {
        alert("Please select the patient's PDF report.");
        return;
    }

    if (file.type !== "application/pdf") {
        alert("Please upload a PDF file only.");
        return;
    }

    const saveButton = document.getElementById("saveReportBtn");
    saveButton.disabled = true;

    let uploadedPath = null;

    try {
        const safeId = patientId.replace(/[^a-zA-Z0-9_-]/g, "_");
       const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    uploadedPath = `${safeId}/${uniqueName}`;
        const { error: uploadError } = await supabaseClient.storage
            .from("patient-reports")
            .upload(uploadedPath, file, {
                contentType: "application/pdf",
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const report = {
            patient_id: patientId,
            mobile: mobile,
            patient_name: patientName,
            report_number: reportNumber,
            report_date: document.getElementById("reportDate").value || null,
            age: document.getElementById("patientAge").value || null,
            gender: document.getElementById("patientGender").value || null,
            referring_doctor: document.getElementById("referringDoctor").value.trim() || null,
            sample_type: document.getElementById("sampleType").value.trim() || null,
            test_name: testName,
            test_results: document.getElementById("testResults").value.trim() || null,
            report_notes: document.getElementById("reportNotes").value.trim() || null,
            file_path: uploadedPath
        };

        const { error: saveError } = await supabaseClient
            .from("reports")
            .insert([report]);

        if (saveError) {
            await supabaseClient.storage
                .from("patient-reports")
                .remove([uploadedPath]);
            uploadedPath = null;
            throw saveError;
        }

        alert("Patient details and PDF uploaded successfully!");
        await loadSavedReports(
    document.getElementById("reportSearch").value.trim()
);
        fileInput.value = "";
        document.getElementById("patientName").value = "";
        document.getElementById("patientId").value = "";
        document.getElementById("patientMobile").value = "";
        document.getElementById("reportNumber").value = "";
        document.getElementById("testName").value = "";
        document.getElementById("testResults").value = "";
        document.getElementById("reportNotes").value = "";

    } catch (error) {
        console.error("Report upload/save error:", error);
        alert("Report save nahi hui. Please check the Storage and reports permissions, then try again.");
    } finally {
        saveButton.disabled = false;
    }
});

startDashboard();