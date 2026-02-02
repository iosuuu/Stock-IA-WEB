import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        overview: 'Overview',
        analytics: 'Analytics',
        activity: 'Activity History',
        trace: 'Trace & Analyze',
        stock: 'Stock Manager',
        admin: 'Admin',
        switchCompany: 'Switch Company',
        userManagement: 'User Management',
        logOut: 'Log Out',
        selectLanguage: 'Language'
    },
    es: {
        overview: 'Resumen',
        analytics: 'Analítica',
        activity: 'Historial',
        trace: 'Rastrear y Analizar',
        stock: 'Gestor de Stock',
        admin: 'Administrador',
        switchCompany: 'Cambiar Empresa',
        userManagement: 'Gestión de Usuarios',
        logOut: 'Cerrar Sesión',
        selectLanguage: 'Idioma'
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const t = (key) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = (lang) => {
        setLanguage(lang);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
