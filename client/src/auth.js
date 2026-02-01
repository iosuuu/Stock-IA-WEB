const API_URL = 'http://localhost:3001/api';

export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error('Login failed');
    }

    const data = await response.json();
    if (data.auth) {
        // Clear any previous company context to avoid mix-ups
        localStorage.removeItem('trace_current_company');
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
    }
    return data;
};

export const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('trace_current_company');
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const authHeader = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { Authorization: 'Bearer ' + token };
    } else {
        return {};
    }
};
