const CustomerController = (() => {
    const { appState, uid, saveState, findCustomer, findSet, BAR_LENGTH_MM } = window.AppData;

    function createCustomer(name) {
        appState.customers.push({
            id: uid("cus"),
            name,
            isCollapsed: false,
            sets: []
        });
        saveState();
        window.AppUI.render();
    }

    function deleteCustomer(customerId) {
        appState.customers = appState.customers.filter((customer) => customer.id !== customerId);
        saveState();
        window.AppUI.render();
    }

    function toggleCustomerCollapse(customerId) {
        const customer = findCustomer(customerId);
        if (!customer) return;
        customer.isCollapsed = !customer.isCollapsed;
        saveState();
        window.AppUI.render();
    }

    function addSet(customerId, setName) {
        const customer = findCustomer(customerId);
        if (!customer) return;
        customer.sets.push({
            id: uid("set"),
            name: setName,
            segments: []
        });
        saveState();
        window.AppUI.render();
    }

    function deleteSet(customerId, setId) {
        const customer = findCustomer(customerId);
        if (!customer) return;
        customer.sets = customer.sets.filter((set) => set.id !== setId);
        saveState();
        window.AppUI.render();
    }

    function addSegment(customerId, setId, lengthMm, quantity, segmentType) {
        const set = findSet(customerId, setId);
        if (!set) return;
        const safeLength = Math.min(Number(lengthMm) || 0, BAR_LENGTH_MM);
        set.segments.push({
            id: uid("seg"),
            lengthMm: safeLength,
            quantity: Number(quantity) || 0,
            segmentType: segmentType
        });
        saveState();
        window.AppUI.render();
    }

    function updateSegment(customerId, setId, segmentId, field, value) {
        const set = findSet(customerId, setId);
        if (!set) return;
        const segment = set.segments.find((item) => item.id === segmentId);
        if (!segment) return;
        if (field === "lengthMm") {
            const numericValue = Number(value) || 0;
            segment[field] = Math.min(numericValue, BAR_LENGTH_MM);
        } else if (field === "segmentType") {
            segment[field] = value;
        } else {
            const numericValue = Number(value) || 0;
            segment[field] = numericValue;
        }
        saveState();
        window.AppUI.render();
    }

    function deleteSegment(customerId, setId, segmentId) {
        const set = findSet(customerId, setId);
        if (!set) return;
        set.segments = set.segments.filter((segment) => segment.id !== segmentId);
        saveState();
        window.AppUI.render();
    }

    function resetAll() {
        appState.customers = [];
        saveState();
        window.AppUI.render();
    }

    function getSetTotalQty(set) {
        return set.segments.reduce((sum, segment) => sum + (Number(segment.quantity) || 0), 0);
    }

    return {
        createCustomer,
        deleteCustomer,
        toggleCustomerCollapse,
        addSet,
        deleteSet,
        addSegment,
        updateSegment,
        deleteSegment,
        resetAll,
        getSetTotalQty
    };
})();

window.CustomerController = CustomerController;
