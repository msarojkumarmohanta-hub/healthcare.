import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go

st.set_page_config(page_title="RuralCare AI", page_icon="💙", layout="wide")

NAV_ITEMS = [
    "Dashboard",
    "My Health",
    "Monitoring",
    "Connected Devices",
    "AI Insights",
    "Consultations",
    "Prescriptions",
    "Health Reports",
    "Privacy & Security",
]

DEFAULT_NOTIFICATIONS = [
    {
        "id": 1,
        "title": "Doctor advice received",
        "type": "advice",
        "doctor": "Dr. Rohan Das",
        "summary": "Continue your blood sugar monitoring and stay hydrated.",
        "details": "Your readings are stable. Please continue with your existing medication plan, keep a note of your fasting glucose, and schedule a follow-up if you notice dizziness or fatigue.",
        "timestamp": "Today · 9:30 AM",
    },
    {
        "id": 2,
        "title": "New prescription added",
        "type": "prescription",
        "doctor": "Dr. Priya Sen",
        "summary": "Updated care plan for your blood pressure and recovery.",
        "details": "The prescription below is recommended for the next 7 days. Please review the dosage and save it to your personal prescription list for pharmacy pickup.",
        "timestamp": "Today · 11:15 AM",
        "prescription": {
            "doctor": "Dr. Priya Sen",
            "date": "24 June 2024",
            "advice": "Keep your blood pressure stable with medication and consistent rest. Follow-up after 7 days.",
            "medicines": [
                {"name": "Amlodipine", "dosage": "5 mg", "instructions": "Once daily · After breakfast · 7 days"},
                {"name": "Vitamin D3", "dosage": "60,000 IU", "instructions": "Once weekly · After dinner · 4 weeks"},
            ],
        },
    },
]

DEFAULT_PRESCRIPTIONS = [
    {
        "doctor": "Dr. Rohan Das",
        "date": "24 June 2024",
        "advice": "Continue with your current routine and return if you feel weak or dizzy.",
        "medicines": [
            {"name": "Metformin 500 mg", "dosage": "500 mg", "instructions": "Once daily · After breakfast · 30 days"},
            {"name": "Vitamin D3", "dosage": "1000 IU", "instructions": "Once weekly · With food · 8 weeks"},
        ],
    }
]


def init_session_state():
    if "selected_page" not in st.session_state:
        st.session_state.selected_page = "Dashboard"
    if "notifications" not in st.session_state:
        st.session_state.notifications = DEFAULT_NOTIFICATIONS
    if "saved_prescriptions" not in st.session_state:
        st.session_state.saved_prescriptions = DEFAULT_PRESCRIPTIONS
    if "selected_notification_id" not in st.session_state:
        st.session_state.selected_notification_id = DEFAULT_NOTIFICATIONS[0]["id"]
    if "monitoring" not in st.session_state:
        st.session_state.monitoring = False
    if "heart_rate" not in st.session_state:
        st.session_state.heart_rate = 74
    if "uploaded_report" not in st.session_state:
        st.session_state.uploaded_report = False
    if "support_open" not in st.session_state:
        st.session_state.support_open = False
    if "profile_open" not in st.session_state:
        st.session_state.profile_open = False


init_session_state()


@st.dialog("Care team support")
def support_dialog():
    st.write("Your support request has been queued. A rural care coordinator will review your message and contact you through the app.")
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Close", use_container_width=True):
            st.session_state.support_open = False
    with col2:
        if st.button("Book a consultation", use_container_width=True):
            st.session_state.selected_page = "Consultations"
            st.session_state.support_open = False


@st.dialog("Patient profile")
def profile_dialog():
    st.markdown(
        """
        **Anita Mishra**  
        Patient ID: RCL-2048

        - Phone: +91 98765 43210
        - Location: Koraput, Odisha
        - Care plan: RuralCare Plus
        """
    )
    if st.button("Manage privacy"):
        st.session_state.selected_page = "Privacy & Security"
        st.session_state.profile_open = False
    if st.button("Close"):
        st.session_state.profile_open = False


if st.session_state.support_open:
    support_dialog()

if st.session_state.profile_open:
    profile_dialog()


def render_metric_card(title, value, delta, subtitle, accent="teal"):
    color_map = {
        "teal": "#dff3f1",
        "coral": "#fde7e4",
        "amber": "#fff3d7",
        "blue": "#e7f1ff",
    }
    st.markdown(
        f"""
        <div style="padding:16px;border-radius:16px;background:{color_map.get(accent, '#edf5f2')};border:1px solid rgba(0,0,0,0.04);">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#62736f;">{title}</div>
            <div style="font-size:30px;font-weight:700;margin-top:8px;letter-spacing:-1px;color:#213b41;">{value}</div>
            <div style="margin-top:6px;font-size:11px;color:#526760;">{delta}</div>
            <div style="margin-top:4px;font-size:10px;color:#72908b;">{subtitle}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_notification_panel():
    st.subheader("Care updates")
    st.caption("Doctor advice and prescription updates")
    selected_notification = next(
        (item for item in st.session_state.notifications if item["id"] == st.session_state.selected_notification_id),
        st.session_state.notifications[0],
    )

    notification_cols = st.columns([1.2, 1.8])
    with notification_cols[0]:
        for notification in st.session_state.notifications:
            card_type = "primary" if notification["id"] == selected_notification["id"] else "secondary"
            if st.button(
                f"{notification['title']}\n{notification['timestamp']}",
                key=f"notification_{notification['id']}",
                use_container_width=True,
                type=card_type,
            ):
                st.session_state.selected_notification_id = notification["id"]

    with notification_cols[1]:
        st.markdown(f"### {selected_notification['title']}")
        st.markdown(f"**{selected_notification['doctor']}**")
        st.write(selected_notification["details"])

        if selected_notification.get("prescription"):
            prescription = selected_notification["prescription"]
            st.markdown(f"#### {prescription['doctor']}")
            st.write(prescription["advice"])
            for medicine in prescription["medicines"]:
                st.markdown(
                    f"- **{medicine['name']}** — {medicine['dosage']} · {medicine['instructions']}"
                )
            if st.button("Save prescription", key=f"save_{selected_notification['id']}"):
                is_duplicate = any(
                    prescription_item["doctor"] == prescription["doctor"] and prescription_item["date"] == prescription["date"]
                    for prescription_item in st.session_state.saved_prescriptions
                )
                if not is_duplicate:
                    st.session_state.saved_prescriptions.insert(0, prescription)
                    st.success("Prescription saved to your list.")
                else:
                    st.info("This prescription is already saved.")


def render_dashboard():
    st.markdown("### Good morning, Anita ✦")
    st.caption("Monday, 24 June 2024")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        render_metric_card("Heart rate", f"{st.session_state.heart_rate} BPM", "↑ 2.4%", "In range", "coral")
    with c2:
        render_metric_card("SpO2", "98%", "↑ 0.8%", "Optimal", "teal")
    with c3:
        render_metric_card("Blood glucose", "92 mg/dL", "Stable", "In range", "amber")
    with c4:
        render_metric_card("Blood pressure", "118/76", "Healthy", "Stable", "blue")

    chart_df = pd.DataFrame(
        {
            "time": ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "Now"],
            "value": [71, 76, 73, 81, 78, st.session_state.heart_rate],
        }
    )
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=chart_df["time"], y=chart_df["value"], mode="lines+markers", line=dict(color="#df665b", width=3), fill="tozeroy", fillcolor="rgba(223, 102, 91, 0.12)"))
    fig.update_layout(margin=dict(l=10, r=10, t=10, b=10), height=260, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", showlegend=False)
    st.plotly_chart(fig, use_container_width=True)

    col_left, col_right = st.columns([1.5, 1])
    with col_left:
        st.subheader("Connected devices")
        st.write("RuralCare Watch · Connected · 82% battery")
        st.write("Mobile health app · Active · Synced just now")
    with col_right:
        st.subheader("AI insight")
        st.write("Heart rate is holding steady within your usual range this week. Keep up your morning walks.")


def render_my_health():
    st.subheader("Your health, in one clear view")
    st.caption("Only measurements received from your connected device are shown here.")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("**Heart rate**")
        st.metric("Current", f"{st.session_state.heart_rate} BPM", "2.4%")
    with c2:
        st.markdown("**Blood oxygen**")
        st.metric("SpO2", "98%", "0.8%")
    with c3:
        st.markdown("**Body temperature**")
        st.metric("Temp", "36.8°C", "0.1°C")

    history_df = pd.DataFrame({"Time": ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "Now"], "BPM": [72, 74, 70, 81, 78, st.session_state.heart_rate]})
    st.line_chart(history_df.set_index("Time"))


def render_monitoring():
    st.subheader("Stay connected between visits")
    if st.button("Start monitoring" if not st.session_state.monitoring else "Stop monitoring"):
        st.session_state.monitoring = not st.session_state.monitoring

    st.metric("Current heart rate", f"{st.session_state.heart_rate} BPM", "Live signal" if st.session_state.monitoring else "Last saved measurement")
    readings = pd.DataFrame({"Time": ["08:00", "09:00", "10:00", "11:00", "Now"], "Heart Rate": [72, 74, 70, 76, st.session_state.heart_rate]})
    st.line_chart(readings.set_index("Time"))


def render_devices():
    st.subheader("Connected devices")
    col1, col2 = st.columns([2, 1])
    with col1:
        st.write("**RuralCare Watch**")
        st.write("Connected · 82% battery")
    with col2:
        if st.button("Connect device", use_container_width=True):
            st.info("This demo simulates a successful connection.")

    st.markdown("---")
    st.write("**Supported connection**")
    st.write("Web Bluetooth can connect to compatible wearables and read heart-rate measurements.")


def render_ai_insights():
    st.subheader("AI health intelligence")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.success("Cardiovascular risk · Low indication")
    with c2:
        st.warning("Respiratory risk · Monitor")
    with c3:
        st.error("Diabetes risk · Requires clinician review")

    st.markdown("### Observed pattern")
    st.write("Recent measurements show a small change from Anita’s historical baseline. Review recent vitals, medication adherence and patient-reported symptoms before making a care decision.")
    if st.button("Review with doctor"):
        st.session_state.selected_page = "Consultations"


def render_consultations():
    st.subheader("Find the right care, from anywhere.")
    doctor_data = [
        {"name": "Dr. Rohan Das", "specialty": "General physician", "detail": "Available today · Hindi, English", "price": "₹150"},
        {"name": "Dr. Priya Sen", "specialty": "Cardiology", "detail": "Tomorrow · English, Odia", "price": "₹140"},
        {"name": "Dr. Amit Jena", "specialty": "Diabetology", "detail": "Thu, 27 Jun · Hindi, Odia", "price": "₹130"},
    ]
    for doctor in doctor_data:
        with st.container(border=True):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(f"### {doctor['name']}")
                st.write(f"**{doctor['specialty']}**")
                st.write(doctor["detail"])
                st.write(f"Consultation: {doctor['price']}")
            with col2:
                if st.button("Video", key=f"video_{doctor['name']}"):
                    st.success(f"Video consultation request saved for {doctor['name']}")
                if st.button("Audio", key=f"audio_{doctor['name']}"):
                    st.success(f"Audio consultation request saved for {doctor['name']}")


def render_prescriptions():
    st.subheader("Your prescriptions")
    if not st.session_state.saved_prescriptions:
        st.info("No prescriptions saved yet. Save a prescription from a notification to see it here.")
        return

    for index, prescription in enumerate(st.session_state.saved_prescriptions):
        with st.container(border=True):
            st.markdown(f"### {prescription['doctor']}")
            st.caption(f"{prescription['date']} · {'Active' if index == 0 else 'Saved'}")
            st.write(prescription["advice"])
            for medicine in prescription["medicines"]:
                st.markdown(f"- **{medicine['name']}** — {medicine['dosage']} · {medicine['instructions']}")

            pharmacist = st.selectbox(
                "Choose a pharmacist",
                ["Green Valley Pharmacy", "RuralCare Chemist", "Sunrise Health Store"],
                key=f"pharmacy_{index}",
                index=0,
            )
            if st.button("Send to pharmacy", key=f"send_{index}"):
                st.success(f"Prescription sent to {pharmacist}.")


def render_reports():
    st.subheader("Health reports")
    uploaded = st.file_uploader("Upload a lab report or medical document", type=["pdf", "png", "jpg", "jpeg"])
    if uploaded is not None:
        st.session_state.uploaded_report = True
        st.success(f"{uploaded.name} uploaded successfully.")

    if st.session_state.uploaded_report:
        st.write("**Informational findings**")
        st.write("Hemoglobin: 13.2 g/dL · In range")
        st.write("Fasting glucose: 92 mg/dL · In range")
        st.write("Questions to discuss: 3 suggestions")


def render_security():
    st.subheader("Privacy & security")
    st.checkbox("Share data with connected providers", value=True)
    st.checkbox("Health alert notifications", value=True)
    st.checkbox("Login verification", value=True)
    st.checkbox("Emergency contact sharing", value=False)
    if st.button("Save privacy choices"):
        st.success("Privacy choices saved.")


if "selected_page" not in st.session_state:
    st.session_state.selected_page = "Dashboard"

with st.sidebar:
    st.markdown("### RuralCare AI")
    st.caption("Demo mode")

    for item in NAV_ITEMS:
        if st.button(item, use_container_width=True, type="primary" if item == st.session_state.selected_page else "secondary"):
            st.session_state.selected_page = item

    st.markdown("---")
    if st.button("Need support?", use_container_width=True):
        st.session_state.support_open = True

    st.markdown("---")
    if st.button("Anita Mishra", use_container_width=True):
        st.session_state.profile_open = True


# Top-of-page notification strip
st.write("\n")
if st.session_state.notifications:
    notification_count = len(st.session_state.notifications)
    st.caption(f"Notifications: {notification_count}")

page_map = {
    "Dashboard": render_dashboard,
    "My Health": render_my_health,
    "Monitoring": render_monitoring,
    "Connected Devices": render_devices,
    "AI Insights": render_ai_insights,
    "Consultations": render_consultations,
    "Prescriptions": render_prescriptions,
    "Health Reports": render_reports,
    "Privacy & Security": render_security,
}

if st.session_state.selected_page == "Dashboard":
    render_notification_panel()

page_map[st.session_state.selected_page]()

if st.session_state.selected_page != "Dashboard":
    st.write("---")
    render_notification_panel()

st.markdown(
    "<div style='margin-top:24px; padding-top:12px; border-top:1px solid rgba(0,0,0,0.08); color:#6a7f7d; font-size:12px;'>Your data is private and secure · Informational support only. Not a replacement for professional medical care.</div>",
    unsafe_allow_html=True,
)
