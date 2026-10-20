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

    message.textContent = "";

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

        if (!response.ok || !data.signedUrl) {
            message.textContent = "Report nahi mili. Patient name aur registered mobile number check karein.";
            return;
        }

        message.textContent = "Report verified. Opening report...";
       const link = document.createElement("a");
link.href = data.signedUrl;
link.target = "_blank";
link.rel = "noopener noreferrer";
link.click();
   } catch (error) {
    console.error("Report search error:", error);
    message.textContent = "Error: " + error.message;
   } finally {
        this.disabled = false;
        this.textContent = "Search Report";
    }
});