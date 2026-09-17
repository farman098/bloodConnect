const apiHost = window.location.hostname || "127.0.0.1";

export const API_URL = `http://${apiHost}:3000/api`;

export const getSession = () => ({
    token: localStorage.getItem("pulseToken"),
    user: JSON.parse(localStorage.getItem("pulseUser") || "null"),
});

export const clearSession = () => {
    localStorage.removeItem("pulseToken");
    localStorage.removeItem("pulseUser");
};

export async function apiRequest(path, options = {}) {
    const { token } = getSession();
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
}

export const goTo = (path) => {
    window.location.href = path;
};