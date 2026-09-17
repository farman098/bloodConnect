import { useEffect, useState } from "react";
import { apiRequest, clearSession, getSession, goTo, API_URL } from "./api.js";
import "./auth.css";
import "./dashboard.css";
import "./profile.css";
import "./request.css";
import "./admin.css";

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

function AuthLayout({ mode, children }) {
    const isRegister = mode === "register";
    return <main className="auth-page">
        <section className="auth-art"><div className="auth-mark" aria-hidden="true" /><div className="auth-art-content">
            <h1>{ isRegister ? <>One profile.<br /><span>Many lives touched.</span></> : <>Welcome back.<br /><span>Your match matters.</span></> }</h1>
            <p>{ isRegister ? "Join a community ready to respond when a blood type is needed most." : "Keep your donor profile current so nearby requests can reach you." }</p>
        </div></section>
        <section className="auth-panel"><a className="auth-brand" href="/index.html"><span className="auth-brand-mark">P</span>Pulse</a>{ children }</section>
    </main>;
}

export function AuthPage({ mode }) {
    const isRegister = mode === "register";
    const [form, setForm] = useState(isRegister
        ? { name: "", email: "", password: "", bloodType: "O+", age: "", eligibility: "Needs review" }
        : { email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const data = await fetch(`${API_URL}/auth/${isRegister ? "register" : "login"}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
            }).then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || "Request failed.");
                return result;
            });
            localStorage.setItem("pulseToken", data.token);
            localStorage.setItem("pulseUser", JSON.stringify(data.user));
            goTo(data.user.role === "admin" ? "/admin.html" : data.user.role === "requester" ? "/request.html" : "/dashboard.html");
        } catch (error) {
            setMessage(error.name === "TypeError" ? "Backend connection failed. Start the API server first." : error.message);
            setLoading(false);
        }
    }

    return <AuthLayout mode={ mode }><div className="auth-kicker">{ isRegister ? "Join the community" : "Welcome back" }</div>
        <h2>{ isRegister ? "Become a donor." : "Log in to Pulse." }</h2>
        <p>{ isRegister ? "Create your profile and be ready for the next request in your area." : "Manage your donor profile and stay ready to help." }</p>
        <form className="auth-form" onSubmit={ submit }>
            { isRegister && <label>Full name<input name="name" value={ form.name } onChange={ update } placeholder="Ayesha Khan" required /></label> }
            <label>Email address<input name="email" type="email" value={ form.email } onChange={ update } placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" value={ form.password } onChange={ update } minLength="6" placeholder="Your password" required /></label>
            { isRegister && <>
                <label>Blood type<select name="bloodType" value={ form.bloodType } onChange={ update }>{ bloodTypes.map((type) => <option key={ type }>{ type }</option>) }</select></label>
                <label>Age<input name="age" type="number" min="16" max="100" value={ form.age } onChange={ update } required /></label>
                <label>Eligibility<select name="eligibility" value={ form.eligibility } onChange={ update }><option>Needs review</option><option>Eligible</option><option>Not eligible</option></select></label>
            </> }
            <p className="auth-message" aria-live="polite">{ message }</p><button className="auth-submit" type="submit" disabled={ loading }>{ loading ? "Please wait..." : isRegister ? "Create donor profile" : "Log in" }</button>
        </form>
        <p className="auth-switch">{ isRegister ? "Already have an account? " : "New to Pulse? " }<a href={ isRegister ? "/login.html" : "/register.html" }>{ isRegister ? "Log in" : "Create a donor profile" }</a></p>
    </AuthLayout>;
}

function Protected({ children, role }) {
    const { token, user } = getSession();
    if (!token || !user || (role && user.role !== role)) {
        goTo("/login.html");
        return null;
    }
    return children;
}

function AppTopbar() {
    return <header className="topbar"><a className="brand" href="/index.html"><span>P</span>Pulse</a><button className="logout" onClick={ () => { clearSession(); goTo("/login.html"); } }>Log out</button></header>;
}

export function DashboardPage() {
    const { user } = getSession();
    const [profile, setProfile] = useState({});
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState("Loading requests...");
    const [availability, setAvailability] = useState("Available");

    async function load() {
        try { setProfile(await apiRequest("/profile/me")); setRequests(await apiRequest("/requests")); setMessage(""); }
        catch (error) { setMessage(error.message); }
    }
    useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, []);
    async function updateAvailability(event) { setAvailability(event.target.value); try { const data = await apiRequest("/profile/me", { method: "PATCH", body: JSON.stringify({ availability: event.target.value }) }); setProfile((current) => ({ ...current, ...data })); setMessage(`Availability updated: ${data.availability}`); } catch (error) { setMessage(error.message); } }
    async function respond(id, response) { try { await apiRequest(`/requests/${id}/respond`, { method: "PATCH", body: JSON.stringify({ response }) }); setMessage(`Request ${response.toLowerCase()}.`); load(); } catch (error) { setMessage(error.message); } }
    return <Protected><AppTopbar /><main className="wrap"><div className="heading"><div><div className="eyebrow">Donor dashboard</div><h1>Hello, <span>{ user?.name || "Donor" }</span>.</h1></div><p>Your profile is ready to help when a matching blood request appears nearby.</p></div>
        <div className="actions"><a className="button primary" href="/request.html">Request blood</a><a className="button" href="/profile.html">Update profile</a><button className="button" onClick={ async () => { if ("Notification" in window) setMessage((await Notification.requestPermission()) === "granted" ? "Emergency notifications enabled." : "Notifications were not enabled."); } }>Enable notifications</button></div>
        <section className="stats"><div className="stat"><strong>{ profile.bloodType || "--" }</strong><span>Your blood type</span></div><div className="stat"><strong>{ profile.availability || availability }</strong><span>Availability</span></div><div className="stat"><strong>{ profile.donationHistory?.length || 0 }</strong><span>Donations recorded</span></div></section>
        <section className="profile-strip"><div><span className="eyebrow">Eligibility</span><strong>{ profile.eligibility || "Needs review" }</strong></div><label>Availability<select value={ profile.availability || availability } onChange={ updateAvailability }><option>Available</option><option>Not Available</option></select></label><div><span className="eyebrow">Last donation</span><strong>{ profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString() : "Not recorded" }</strong></div></section>
        <div className="eyebrow">Latest requests</div><h2>People who need a match. <span className="live-label">● Live updates</span></h2><p className="dashboard-message" aria-live="polite">{ message }</p><section className="request-list">{ requests.length ? requests.map((request) => <article className="request-card" key={ request._id }><div className="blood">{ request.bloodType }</div><div><h3>{ request.patientName }</h3><p>{ request.hospital }, { request.city } · { request.units } unit(s)</p><div className="request-actions"><button onClick={ () => respond(request._id, "Accepted") }>Accept Request</button><button onClick={ () => respond(request._id, "Declined") }>Decline</button></div></div><div className="urgency">{ request.urgency }<br /><small>{ request.status }</small></div></article>) : <div className="empty">{ message || "No blood requests yet. Create the first one." }</div> }</section>
    </main></Protected>;
}

export function ProfilePage() {
    const [form, setForm] = useState({}); const [history, setHistory] = useState([]); const [message, setMessage] = useState("Loading profile...");
    useEffect(() => { apiRequest("/profile/me").then((data) => { setForm({ ...data, lastDonationDate: data.lastDonationDate ? new Date(data.lastDonationDate).toISOString().slice(0, 10) : "" }); setHistory(data.donationHistory || []); setMessage(""); }).catch((error) => setMessage(error.message)); }, []);
    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    async function submit(event) { event.preventDefault(); setMessage("Saving..."); try { const data = await apiRequest("/profile/me", { method: "PATCH", body: JSON.stringify(form) }); localStorage.setItem("pulseUser", JSON.stringify(data)); setMessage("Profile updated successfully."); } catch (error) { setMessage(error.message); } }
    return <Protected><main className="profile-page"><section className="profile-box"><a className="back" href="/dashboard.html">← Back to dashboard</a><div className="eyebrow">Donor profile</div><h1>Keep your details current.</h1><p>Accurate information helps Pulse send the right emergency request to you.</p><form className="profile-form" onSubmit={ submit }>{ [["name", "Full name"], ["email", "Email"]].map(([name, label]) => <label key={ name }>{ label }<input name={ name } value={ form[name] || "" } onChange={ update } readOnly={ name === "email" } required /></label>) }<label>Blood type<select name="bloodType" value={ form.bloodType || "O+" } onChange={ update }>{ bloodTypes.map((type) => <option key={ type }>{ type }</option>) }</select></label><label>Age<input name="age" type="number" min="16" max="100" value={ form.age || "" } onChange={ update } required /></label><label>Eligibility<select name="eligibility" value={ form.eligibility || "Needs review" } onChange={ update }><option>Needs review</option><option>Eligible</option><option>Not eligible</option></select></label><label>Availability<select name="availability" value={ form.availability || "Available" } onChange={ update }><option>Available</option><option>Not Available</option></select></label><label>Last donation date<input name="lastDonationDate" type="date" value={ form.lastDonationDate || "" } onChange={ update } /></label><p className="message" aria-live="polite">{ message }</p><button type="submit">Save profile</button></form><section className="history"><div className="eyebrow">Donation history</div>{ history.length ? history.map((item) => <div className="history-item" key={ `${item.date}-${item.location}` }><strong>{ new Date(item.date).toLocaleDateString() }</strong><span>{ item.location || "Location not added" } · { item.units } unit(s)</span></div>) : <p>No donations recorded yet.</p> }</section></section></main></Protected>;
}

export function RequestPage() {
    const [form, setForm] = useState({ patientName: "", bloodType: "O+", units: 1, hospital: "", city: "", urgency: "Urgent" }); const [message, setMessage] = useState("");
    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    async function submit(event) { event.preventDefault(); setMessage("Submitting..."); try { await apiRequest("/requests", { method: "POST", body: JSON.stringify(form) }); goTo("/dashboard.html"); } catch (error) { setMessage(error.message); } }
    return <Protected><main className="request-page"><section className="request-box"><a className="back" href="/index.html">← Back to home</a><h1>Request blood.</h1><p>Share the essentials so nearby verified donors can respond quickly. Admins and donors will see this request.</p><form className="request-form" onSubmit={ submit }>{ [["patientName", "Patient name", "Patient full name"], ["hospital", "Hospital", "Hospital name"], ["city", "City", "Peshawar"]].map(([name, label, placeholder]) => <label key={ name }>{ label }<input name={ name } value={ form[name] } onChange={ update } placeholder={ placeholder } required /></label>) }<label>Blood type<select name="bloodType" value={ form.bloodType } onChange={ update }>{ bloodTypes.map((type) => <option key={ type }>{ type }</option>) }</select></label><label>Units needed<input name="units" type="number" min="1" max="20" value={ form.units } onChange={ update } required /></label><label>Urgency<select name="urgency" value={ form.urgency } onChange={ update }><option>Critical</option><option>Urgent</option><option>Normal</option></select></label><p className="message" aria-live="polite">{ message }</p><button className="request-submit" type="submit">Submit blood request</button></form></section></main></Protected>;
}

export function AdminPage() {
    const [data, setData] = useState({ stats: {}, requests: [], messages: [], users: [] }); const [message, setMessage] = useState("Loading admin data..."); const [tab, setTab] = useState("requests");
    useEffect(() => { apiRequest("/admin/overview").then((result) => { setData(result); setMessage("Admin data loaded."); }).catch((error) => setMessage(error.message)); }, []);
    async function update(path, status) { try { await apiRequest(`/admin/${path}`, { method: "PATCH", body: JSON.stringify({ status }) }); setMessage("Status updated."); } catch (error) { setMessage(error.message); } }
    const stats = [[data.stats.users, "Registered users"], [data.stats.requests, "Total requests"], [data.stats.openRequests, "Open requests"], [data.stats.newMessages, "New messages"]];
    return <Protected role="admin"><AppTopbar /><main className="wrap"><div className="heading"><div><div className="eyebrow">Admin dashboard</div><h1>Admin control center</h1></div><p>Manage blood requests, contact messages, and donor activity from one place.</p></div><p className="message" aria-live="polite">{ message }</p><section className="stats-grid">{ stats.map(([value, label]) => <article className="stat-card" key={ label }><strong>{ value || 0 }</strong><span>{ label }</span></article>) }</section><nav className="admin-tabs" aria-label="Admin sections">{ [["requests", "Blood requests"], ["messages", "Contact messages"], ["users", "Users"]].map(([key, label]) => <button className={ `tab ${tab === key ? "active" : ""}` } onClick={ () => setTab(key) } key={ key }>{ label }</button>) }</nav><section className="admin-panel active"><h2>{ tab === "requests" ? "Blood requests" : tab === "messages" ? "Contact messages" : "Registered users" }</h2><div className="message-list">{ tab === "requests" && data.requests.map((item) => <article className="message-card" key={ item._id }><div className="message-meta"><strong>{ item.patientName } · { item.bloodType }</strong><span>{ new Date(item.createdAt).toLocaleString() }</span></div><p>{ item.hospital }, { item.city } · { item.units } unit(s) · { item.urgency }</p><label>Status <select defaultValue={ item.status } onChange={ (event) => update(`requests/${item._id}`, event.target.value) }><option>Open</option><option>Matched</option><option>Completed</option></select></label></article>) }{ tab === "messages" && data.messages.map((item) => <article className="message-card" key={ item._id }><div className="message-meta"><strong>{ item.name }</strong><span>{ new Date(item.createdAt).toLocaleString() }</span></div><a href={ `mailto:${item.email}` }>{ item.email }</a><p>{ item.message }</p><label>Status <select defaultValue={ item.status } onChange={ (event) => update(`messages/${item._id}`, event.target.value) }><option>New</option><option>Read</option><option>Resolved</option></select></label></article>) }{ tab === "users" && data.users.map((item) => <article className="message-card" key={ item._id }><div className="message-meta"><strong>{ item.name }</strong><span>{ item.role }</span></div><p>{ item.email } · { item.bloodType || "No blood type" } · { item.availability || "Unknown" }</p></article>) }{ !data[tab]?.length && <div className="empty">No records yet.</div> }</div></section></main></Protected>;
}