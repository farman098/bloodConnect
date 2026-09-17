import { useState } from "react";
import "./app.css";
import { apiRequest } from "./api.js";
import {
    AuthPage,
    DashboardPage,
    ProfilePage,
    RequestPage,
} from "./pages.jsx";
import AdminPage from "./AdminPage.jsx";

const navLinks = [
    ["Why Pulse", "why-pulse"],
    ["Impact", "impact"],
    ["Donors", "donors"],
    ["Resources", "resources"],
    ["Contact", "contact"],
];

const stats = [
    { value: "12k+", label: "Lives supported" },
    { value: "4.9/5", label: "Community rating" },
    { value: "2 hrs", label: "Average response time" },
    { value: "98%", label: "Request fulfillment" },
];

const highlights = [
    {
        title: "Urgent matching",
        text: "Connect verified donors and recipients in real time with faster, smarter coordination.",
    },
    {
        title: "Trusted network",
        text: "Every request is routed through a secure, medically-aware platform built for life-saving support.",
    },
    {
        title: "Community-led care",
        text: "Encourage local engagement, transparent communication, and consistent donor participation.",
    },
];

const steps = [
    "Create a request with blood type and urgency details.",
    "Match with verified donors and local responders.",
    "Coordinate safely and receive support without delay.",
];

const emergencyRequests = [
    { hospital: "City Hospital", blood: "O+", city: "Lahore", urgency: "Critical" },
    { hospital: "Shifa Medical", blood: "A-", city: "Islamabad", urgency: "Urgent" },
    { hospital: "Maroof Clinic", blood: "B+", city: "Karachi", urgency: "Priority" },
];

function HomePage() {
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [requestForm, setRequestForm] = useState({
        patientName: "",
        bloodType: "O+",
        city: "Lahore",
        urgency: "Urgent",
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [requestMessage, setRequestMessage] = useState("");
    const [contactMessage, setContactMessage] = useState("");

    const handleLoginChange = (event) => {
        const { name, value } = event.target;
        setLoginForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRequestChange = (event) => {
        const { name, value } = event.target;
        setRequestForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleLoginSubmit = (event) => {
        event.preventDefault();
        if (loginForm.email && loginForm.password) {
            setIsLoggedIn(true);
        }
    };

    const handleRequestSubmit = (event) => {
        event.preventDefault();
        if (!requestForm.patientName) {
            setRequestMessage("Please enter patient name to continue.");
            return;
        }

        setRequestMessage(
            `${requestForm.patientName}'s ${requestForm.bloodType} request for ${requestForm.city} has been submitted to verified donors.`
        );
    };

    const handleContactSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setContactMessage("Sending your message...");
        try {
            await apiRequest("/contact", {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
            });
            setContactMessage("Thanks for reaching out. Our team will get back to you shortly.");
            form.reset();
        } catch (error) {
            setContactMessage(error.message || "Unable to send your message. Please try again.");
        }
    };

    return (
        <div className="app-shell">
            <header className="navbar">
                <div className="brand" aria-label="Pulse brand">
                    <span className="pulse-icon" aria-hidden="true" />
                    Pulse
                </div>

                <nav aria-label="Main navigation">
                    { navLinks.map(([label, target]) => (
                        <a href={ `#${target}` } key={ label }>
                            { label }
                        </a>
                    )) }
                </nav>

                <div className="nav-actions">
                    <a href="/login.html" className="login">
                        Login
                    </a>
                    <a href="/register.html" className="nav-cta">
                        Book a donor
                    </a>
                </div>
            </header>

            <main>
                <section className="hero">
                    <div className="hero-content">
                        <div className="small-label">
                            <span className="live-dot" aria-hidden="true" />
                            Live donor response network
                        </div>

                        <h1>
                            Give more than <span>blood</span>.
                            <br />
                            Save a life.
                        </h1>

                        <p>
                            Pulse connects hospitals, donors, and communities through a trusted digital platform
                            designed for emergency support, reliable coordination, and rapid response.
                        </p>

                        <div className="hero-buttons">
                            <a href="#request-form" className="red-button">
                                Request blood now
                            </a>
                            <a href="#login-panel" className="outline-button">
                                Become a donor
                            </a>
                        </div>

                        <div className="safe-text">
                            <span>✓</span>
                            Secure, verified, and community-driven support
                        </div>
                    </div>

                    <div className="hero-visual" aria-label="Pulse donor platform illustration">
                        <div className="orbit orbit-one" />
                        <div className="orbit orbit-two" />
                        <div className="orbit orbit-three" />
                        <div className="blood-drop">
                            <div className="drop-shine" />
                        </div>
                        <div className="blood-cell cell-one" />
                        <div className="blood-cell cell-two" />
                        <div className="blood-cell cell-three" />
                        <div className="blood-cell cell-four" />
                        <div className="blood-cell cell-five" />

                        <div className="emergency-card">
                            <div className="emergency-top">
                                <span>Emergency match</span>
                                <small>LIVE</small>
                            </div>

                            <div className="blood-type">
                                <strong>O+</strong>
                                <div>
                                    <b>Urgent request</b>
                                    <small>24 donors within 7 km</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="stats-bar" id="impact" aria-label="Community impact stats">
                    { stats.map((item) => (
                        <div key={ item.label } className="stat-card">
                            <strong>{ item.value }</strong>
                            <span>{ item.label }</span>
                        </div>
                    )) }
                </section>

                <section className="feature-section" id="why-pulse">
                    <div className="section-heading">
                        <div className="section-label">How it works</div>
                        <h2>Faster coordination. Safer outcomes.</h2>
                    </div>

                    <div className="feature-grid">
                        { highlights.map((item) => (
                            <article key={ item.title } className="feature-card">
                                <span className="feature-index">0{ highlights.indexOf(item) + 1 }</span>
                                <h3>{ item.title }</h3>
                                <p>{ item.text }</p>
                            </article>
                        )) }
                    </div>
                </section>

                <section className="dashboard-panel" id="donors">
                    <div className="dashboard-header">
                        <div className="section-label">Live requests</div>
                        <h2>Emergency needs across the network</h2>
                    </div>

                    <div className="dashboard-grid">
                        <div className="request-list">
                            { emergencyRequests.map((request) => (
                                <div key={ `${request.hospital}-${request.blood}` } className="request-item">
                                    <div className="request-tag">{ request.blood }</div>
                                    <div>
                                        <strong>{ request.hospital }</strong>
                                        <span>{ request.city }</span>
                                    </div>
                                    <small>{ request.urgency }</small>
                                </div>
                            )) }
                        </div>

                        <div className="action-stack">
                            <div className="login-panel" id="login-panel">
                                <h3>{ isLoggedIn ? "Donor access active" : "Donor login" }</h3>
                                <form onSubmit={ handleLoginSubmit }>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email address"
                                        value={ loginForm.email }
                                        onChange={ handleLoginChange }
                                    />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={ loginForm.password }
                                        onChange={ handleLoginChange }
                                    />
                                    <button type="submit" className="submit-btn">
                                        { isLoggedIn ? "Logged in" : "Login" }
                                    </button>
                                </form>
                            </div>

                            <div className="request-form" id="request-form">
                                <h3>Request blood support</h3>
                                <form onSubmit={ handleRequestSubmit }>
                                    <input
                                        type="text"
                                        name="patientName"
                                        placeholder="Patient name"
                                        value={ requestForm.patientName }
                                        onChange={ handleRequestChange }
                                    />
                                    <select name="bloodType" value={ requestForm.bloodType } onChange={ handleRequestChange }>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={ requestForm.city }
                                        onChange={ handleRequestChange }
                                    />
                                    <select name="urgency" value={ requestForm.urgency } onChange={ handleRequestChange }>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Critical">Critical</option>
                                        <option value="Priority">Priority</option>
                                    </select>
                                    <button type="submit" className="submit-btn accent">
                                        Submit request
                                    </button>
                                </form>
                                { requestMessage && <p className="request-message">{ requestMessage }</p> }
                            </div>
                        </div>
                    </div>
                </section>

                <section className="process-section" id="resources">
                    <div className="section-heading narrow">
                        <div className="section-label">Our process</div>
                        <h2>Three simple steps from request to rescue.</h2>
                    </div>

                    <div className="process-grid">
                        { steps.map((step, index) => (
                            <div key={ step } className="process-card">
                                <div className="process-no">{ index + 1 }</div>
                                <p>{ step }</p>
                            </div>
                        )) }
                    </div>
                </section>

                <section className="contact-section" id="contact">
                    <div className="contact-copy">
                        <div className="section-label">Contact us</div>
                        <h2>Let&apos;s make support feel closer.</h2>
                        <p>
                            Need help with a blood request, donor profile, or hospital partnership? Send us a message
                            and the Pulse team will help you find the next step.
                        </p>
                        <div className="contact-details">
                            <a href="mailto:hello@pulsecare.org">hello@pulsecare.org</a>
                            <a href="tel:+923001234567">+92 300 123 4567</a>
                            <span>Available every day, 9:00 AM - 9:00 PM</span>
                        </div>
                    </div>

                    <form className="contact-form" onSubmit={ handleContactSubmit }>
                        <div className="contact-form-row">
                            <label>
                                Your name
                                <input name="name" type="text" placeholder="Your name" required />
                            </label>
                            <label>
                                Email address
                                <input name="email" type="email" placeholder="you@example.com" required />
                            </label>
                        </div>
                        <label>
                            How can we help?
                            <textarea name="message" rows="5" placeholder="Tell us what you need..." required />
                        </label>
                        <button type="submit" className="submit-btn">Send message</button>
                        { contactMessage && <p className="contact-message" aria-live="polite">{ contactMessage }</p> }
                    </form>
                </section>
            </main>
        </div>
    );
}

export default function App() {
    const path = window.location.pathname.replace(/\/$/, "") || "/index.html";

    if (path === "/login.html" || path === "/register.html") {
        return <AuthPage mode={ path === "/register.html" ? "register" : "login" } />;
    }

    if (path === "/dashboard.html") return <DashboardPage />;
    if (path === "/profile.html") return <ProfilePage />;
    if (path === "/request.html" || path === "/request-access.html") return <RequestPage />;
    if (path === "/admin.html") return <AdminPage />;

    return <HomePage />;
}
