const SUPABASE_URL = "https://swvnsamzoasocqhyrunu.supabase.co";

const SUPABASE_KEY = "sb_publishable_D4vwmhaWFKRTuojpTlGV6Q_h-OAlAiZ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
document.getElementById("bookingForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const name = this.querySelector('input[placeholder="Enter patient name"]').value;
    const mobile = this.querySelector('input[placeholder="Enter mobile number"]').value;

    const selects = this.querySelectorAll("select");
    const service = selects[0].value;
    const sampleCollection = selects.length > 1 ? selects[1].value : "Not specified";

    const date = this.querySelector('input[type="date"]').value;
    const information = this.querySelector("textarea").value;

    const bookingCode =
        "RUMVI-" +
        new Date().getFullYear() +
        "-" +
        Date.now().toString().slice(-6);

        const { error } = await supabaseClient
        .from("bookings")
        .insert([
            {
                booking_code: bookingCode,
                patient_name: name,
                mobile: mobile,
                test: service,
                preferred_date: date,
                sample_collection: sampleCollection,
                additional_info: information,
                status: "Pending"
            }
        ]);

   if (error) {
    console.error("Booking save error:", error);
    alert("Booking save nahi ho paayi: " + error.message);
    return;
}

    alert(
        "Booking successfully submitted!\\n\\n" +
        "Your Booking ID: " + bookingCode
    );

    this.reset();

});
document.getElementById("searchReportBtn").addEventListener("click", async function () {
    const patientName = document.getElementById("onlinePatientId").value.trim();
    const mobile = document.getElementById("onlineMobile").value.trim();
    const message = document.getElementById("reportSearchMessage");

    message.replaceChildren();

    if (!patientName || !mobile) {
        message.textContent = "Please enter your patient name and registered mobile number.";
        return;
    }

    this.disabled = true;
    this.textContent = "Searching...";

    try {
        const response = await fetch(
            "https://swvnsamzoasocqhyrunu.supabase.co/functions/v1/verify-patient-reports",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY
                },
                body: JSON.stringify({ patientName, mobile })
            }
        );

        const data = await response.json();

        if (!response.ok || !Array.isArray(data.reports) || data.reports.length === 0) {
            message.textContent = "Report nahi mili. Patient name aur registered mobile number check karein.";
            return;
        }

        if (data.reports.length === 1) {
            message.textContent = "Report verified. Opening report...";
            const link = document.createElement("a");
            link.href = data.reports[0].signedUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.click();
            return;
        }

        const heading = document.createElement("p");
        heading.textContent = "Multiple reports found. Select the report you need:";
        message.appendChild(heading);

        data.reports.forEach((report, index) => {
            if (!report.signedUrl) return;

            const link = document.createElement("a");
            link.href = report.signedUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = [
                report.testName || "Lab Report",
                report.reportDate || "",
                report.reportNumber || `Report ${index + 1}`
            ].filter(Boolean).join(" — ");

            link.style.display = "block";
            link.style.margin = "10px 0";
            message.appendChild(link);
        });

    } catch (error) {
        console.error("Report search error:", error);
        message.textContent = "Report search mein error aaya. Please try again.";
    } finally {
        this.disabled = false;
        this.textContent = "Search Report";
    }
});