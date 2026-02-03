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
        selectLanguage: 'Language',
        // Admin Portal
        adminPortal: 'Admin Portal',
        selectOrg: 'Select an organization to manage. Health metrics are calculated in real-time based on stock retention rates.',
        loadingOrg: 'Loading organizations...',
        health: 'Health',
        itemsCap: 'Items',
        // Activity History
        activityHistory: 'Activity History',
        searchLabel: 'Search (SKU/Desc)',
        supplierLabel: 'Supplier / Company',
        dateRange: 'Date Range',
        movementType: 'Movement Type',
        allTypes: 'All Types',
        lastMonth: 'Last Month',
        filter: 'Filter',
        dateTime: 'Date & Time',
        reference: 'Reference',
        details: 'Details',
        loadingHistory: 'Loading history...',
        noMovements: 'No movements found matching filters.',
        unknownItem: 'Unknown Item',
        // Analytics
        warehouseAnalytics: 'Warehouse Analytics',
        totalItems: 'Total Items',
        percentStock: '% of stock',
        statusDist: 'Stock Status Distribution',
        trafficOverview: 'Traffic Overview (Last 7 Days)',
        recentActivity: 'Recent Activity',
        topMovers: 'Top Movers (30 Days)',
        loadingAnalytics: 'Loading Analytics...',
        noData: 'No data available',
        // Trace & Analyze
        aiAnalysisCenter: 'AI Analysis Center',
        dropFile: 'Drop DESADV / EDI file here or click to upload',
        supportedFormats: 'Supported formats: .xml (Items), .txt (CSV)',
        analyzeAi: 'Analyze with AI',
        analyzing: 'Analyzing...',
        processing: 'Processing document structure...',
        extracting: 'Extracting Logistics Data (Supplier, Location)...',
        analysisComplete: 'Analysis Complete',
        aiIdentified: 'The AI has identified the following items:',
        confirmUpdate: 'Confirm & Update Stock',
        stockUpdated: 'Stock updated successfully!',
        analyzeAnother: 'Analyze Another',
        analysisFailed: 'Analysis failed',
        // Stock Manager
        incoming: 'Incoming',
        outgoing: 'Outgoing',
        warehouseOccupancy: 'Warehouse Occupancy',
        items: 'items',
        noStockData: 'No stock data available for stats.',
        searchPlaceholder: 'Search by SKU or Description...',
        sku: 'SKU',
        description: 'Description',
        location: 'Location',
        status: 'Status',
        supplier: 'Supplier',
        quantity: 'Quantity',
        actions: 'Actions',
        editStock: 'Edit Stock Details',
        manualEntry: 'Manual Entry',
        manualExit: 'Manual Exit',
        cancel: 'Cancel',
        confirm: 'Confirm',
        deleteConfirm: 'Are you sure you want to delete {sku}? This is a destructive action.',
        deleteFailed: 'Delete failed',
        operationFailed: 'Operation failed: ',
        // Form Labels
        entryDate: 'Entry Date',
        documentRef: 'Document / Ref',
        // Statuses
        released: 'Released',
        retained: 'Retained',
        quarantine: 'Quarantine'
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
        selectLanguage: 'Idioma',
        // Admin Portal
        adminPortal: 'Portal de Administración',
        selectOrg: 'Selecciona una organización para gestionar. Las métricas de salud se calculan en tiempo real según las tasas de retención de stock.',
        loadingOrg: 'Cargando organizaciones...',
        health: 'Salud',
        itemsCap: 'Ítems',
        // Activity History
        activityHistory: 'Historial de Actividad',
        searchLabel: 'Buscar (SKU/Desc)',
        supplierLabel: 'Proveedor / Empresa',
        dateRange: 'Rango de Fechas',
        movementType: 'Tipo de Movimiento',
        allTypes: 'Todos los Tipos',
        lastMonth: 'Último Mes',
        filter: 'Filtrar',
        dateTime: 'Fecha y Hora',
        reference: 'Referencia',
        details: 'Detalles',
        loadingHistory: 'Cargando historial...',
        noMovements: 'No se encontraron movimientos con esos filtros.',
        unknownItem: 'Ítem Desconocido',
        // Analytics
        warehouseAnalytics: 'Analítica de Almacén',
        totalItems: 'Total Ítems',
        percentStock: '% del stock',
        statusDist: 'Distribución de Estado del Stock',
        trafficOverview: 'Tráfico (Últimos 7 Días)',
        recentActivity: 'Actividad Reciente',
        topMovers: 'Más Movidos (30 Días)',
        loadingAnalytics: 'Cargando Analítica...',
        noData: 'No hay datos disponibles',
        // Trace & Analyze
        aiAnalysisCenter: 'Centro de Análisis IA',
        dropFile: 'Arrastra archivo DESADV / EDI aquí o haz clic para subir',
        supportedFormats: 'Formatos soportados: .xml (Items), .txt (CSV)',
        analyzeAi: 'Analizar con IA',
        analyzing: 'Analizando...',
        processing: 'Procesando estructura del documento...',
        extracting: 'Extrayendo Datos Logísticos (Proveedor, Ubicación)...',
        analysisComplete: 'Análisis Completo',
        aiIdentified: 'La IA ha identificado los siguientes ítems:',
        confirmUpdate: 'Confirmar y Actualizar Stock',
        stockUpdated: '¡Stock actualizado exitosamente!',
        analyzeAnother: 'Analizar Otro',
        analysisFailed: 'Análisis fallido',
        // Stock Manager
        incoming: 'Entrada',
        outgoing: 'Salida',
        warehouseOccupancy: 'Ocupación del Almacén',
        items: 'ítems',
        noStockData: 'No hay datos de stock disponibles para estadísticas.',
        searchPlaceholder: 'Buscar por SKU o Descripción...',
        sku: 'SKU',
        description: 'Descripción',
        location: 'Ubicación',
        status: 'Estado',
        supplier: 'Proveedor',
        quantity: 'Cantidad',
        actions: 'Acciones',
        editStock: 'Editar Detalles del Stock',
        manualEntry: 'Entrada Manual',
        manualExit: 'Salida Manual',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        deleteConfirm: '¿Estás seguro de que quieres eliminar {sku}? Esta es una acción destructiva.',
        deleteFailed: 'Error al eliminar',
        operationFailed: 'Operación fallida: ',
        // Form Labels
        entryDate: 'Fecha de Entrada',
        documentRef: 'Documento / Ref',
        // Statuses
        released: 'Liberado',
        retained: 'Retenido',
        quarantine: 'Cuarentena'
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
