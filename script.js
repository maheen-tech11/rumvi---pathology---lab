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
// ==================================
// RUMVI SPECIAL OFFERS
// ==================================

const offersData = {
    women: [
        { name: "Weakness Profile Female", price: "₹2,399", image: "images/offers/weakness-female.jpg" },
        { name: "Special Female Profile Health Checkup", price: "₹3,399", image: "images/offers/special-female.jpg" },
        { name: "PCOD AMH Profile", price: "₹3,999", image: "images/offers/pcod-amh-profile.jpg" }
    ],

    men: [
        { name: "Weakness Profile Male", price: "₹2,399", image: "images/offers/weakness-male.jpg" },
        { name: "Special Male Profile Health Check", price: "₹3,399", image: "images/offers/special-male.jpg" }
    ],

    hair: [
        { name: "Hair Envest Package 2", price: "₹3,199", image: "images/offers/hair-envest-2.jpg" },
        { name: "Hair Envest Package 1", price: "₹2,599", image: "images/offers/hair-envest-1.jpg" }
    ],

    gym: [
        { name: "GYM – Titanium Package", price: "₹3,199", image: "images/offers/gym-titanium.jpg" }
    ],

    skin: [
        { name: "Jaanch - Mens Skin Care Checkup", price: "₹3,699", image: "images/offers/jaanch-mens-skin-care.jpg" }
    ],

    health: [
        { name: "Allergy Profile Package", price: "₹5,555", image: "images/offers/allergy-profile.jpg" },
        { name: "Special Health Package", price: "₹2,399", image: "images/offers/special-health.jpg" },
        { name: "Complete Health Test Package", price: "₹1,899", image: "images/offers/complete-health-test.jpg" },
        { name: "Family Health Package", price: "₹3,699", image: "images/offers/family-health.jpg" },
        { name: "Aarogyam XL Plus Package", price: "₹11,999", image: "images/offers/aarogyam-xl-plus.jpg" },
        { name: "Cardiac Risk Markers", price: "₹6,275", image: "images/offers/cardiac-risk.jpg" },
        { name: "Cancer Detection Profile 1", price: "₹6,000", image: "images/offers/cancer-detection.jpg" },
        { name: "HORMONE Profile Test Package", price: "₹2,199", image: "images/offers/hormone-profile.jpg" }
    ]
};

function showOffers(category) {

    const container = document.getElementById("offerPackages");
    const packages = offersData[category];

    if (!packages || !container) return;

    const categoryNames = {
        women: "Women's Health Packages",
        men: "Men's Health Packages",
        hair: "Hair Care Packages",
        gym: "Gym & Fitness Packages",
        skin: "Skin Care Packages",
        health: "Complete Health Packages"
    };

    container.innerHTML = `
        <div class="offer-folder-backdrop"
             onclick="if(event.target === this) closeOfferFolder()">

            <div class="offer-folder">

                <button class="folder-close"
                        onclick="closeOfferFolder()">
                    &times;
                </button>

                <h2>📁 ${categoryNames[category]}</h2>

                <div class="offer-photo-grid">
                    ${packages.map((item, index) => `
                        <div class="offer-photo-card">

                            ${item.image
                                ? `<img src="${item.image}"
                                    alt="${item.name}"
                                    onclick="openOfferPhoto('${category}', ${index})">`
                                : `<div class="no-offer-photo">
                                    Photo Coming Soon
                                   </div>`
                            }

                            <h3>${item.name}</h3>
                            <p class="offer-price">${item.price}</p>

                        </div>
                    `).join("")}
                </div>

            </div>
        </div>
    `;
}

function closeOfferFolder() {
    document.getElementById("offerPackages").innerHTML = "";
}
function openOfferPhoto(category, index) {

    const item = offersData[category][index];

    if (!item || !item.image) {
        alert("Is package ki photo available nahi hai.");
        return;
    }

    const popup = document.getElementById("offerPopup");
    const popupImage = document.getElementById("offerPopupImage");

    popupImage.src = item.image;
    popupImage.alt = item.name;

    popup.style.display = "flex";
}
function closeOfferPopup(event) {

    const popup = document.getElementById("offerPopup");
    const popupImage = document.getElementById("offerPopupImage");

    if (
        !event ||
        event.target.id === "offerPopup" ||
        event.target.classList.contains("offer-close")
    ) {
        popup.style.display = "none";
        popupImage.src = "";
    }
}