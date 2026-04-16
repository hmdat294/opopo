const AppData = (() => {
    const STORAGE_KEY = "aluminumEstimatorData";
    const BAR_LENGTH_MM = 5800;
    const KERF_MM = 10;
    const appState = { customers: [] };

    function uid(prefix) {
        return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }

    function normalizeCustomer(customer) {
        return {
            id: customer.id || uid("cus"),
            name: customer.name || "Ten",
            isCollapsed: Boolean(customer.isCollapsed),
            sets: Array.isArray(customer.sets) ? customer.sets.map((set) => ({
                id: set.id || uid("set"),
                name: set.name || "Bo",
                segments: Array.isArray(set.segments) ? set.segments.map((segment) => ({
                    id: segment.id || uid("seg"),
                    lengthMm: Number(segment.lengthMm) || 0,
                    quantity: Number(segment.quantity) || 0,
                    segmentType: segment.segmentType
                })) : []
            })) : []
        };
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }

    function loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.customers)) {
                appState.customers = parsed.customers.map(normalizeCustomer);
            }
        } catch (error) {
            console.error("Khong doc duoc du lieu localStorage:", error);
        }
    }

    function findCustomer(customerId) {
        return appState.customers.find((item) => item.id === customerId);
    }

    function findSet(customerId, setId) {
        const customer = findCustomer(customerId);
        if (!customer) return null;
        return customer.sets.find((item) => item.id === setId) || null;
    }

    return {
        STORAGE_KEY,
        BAR_LENGTH_MM,
        KERF_MM,
        appState,
        uid,
        normalizeCustomer,
        saveState,
        loadState,
        findCustomer,
        findSet
    };
})();

window.AppData = AppData;
