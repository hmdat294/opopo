const AluminumService = (() => {
    let aluminumTypes = [];

    async function loadAluminumTypes() {
        try {
            const response = await fetch('./db.json');
            const data = await response.json();
            aluminumTypes = data.aluminumTypes || [];
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu nhôm:', error);
            aluminumTypes = [];
        }
    }

    function getAluminumTypes() {
        return [...aluminumTypes];
    }

    function getAluminumById(id) {
        return aluminumTypes.find(a => a.id === id);
    }

    function getAluminumByCode(code) {
        return aluminumTypes.find(a => a.code === code);
    }

    function addAluminum(name, code, weightPerMeter) {
        const newAluminum = {
            id: `alum_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            name: name.trim(),
            code: code.trim(),
            weightPerMeter: Number(weightPerMeter) || 0
        };
        aluminumTypes.push(newAluminum);
        return newAluminum;
    }

    function updateAluminum(id, name, code, weightPerMeter) {
        const aluminum = getAluminumById(id);
        if (!aluminum) return null;
        aluminum.name = name.trim();
        aluminum.code = code.trim();
        aluminum.weightPerMeter = Number(weightPerMeter) || 0;
        return aluminum;
    }

    function deleteAluminum(id) {
        const index = aluminumTypes.findIndex(a => a.id === id);
        if (index === -1) return false;
        aluminumTypes.splice(index, 1);
        return true;
    }

    function getWeightByType(type) {
        const aluminum = getAluminumByCode(type);
        return aluminum ? aluminum.weightPerMeter : 0;
    }

    return {
        loadAluminumTypes,
        getAluminumTypes,
        getAluminumById,
        getAluminumByCode,
        addAluminum,
        updateAluminum,
        deleteAluminum,
        getWeightByType
    };
})();

window.AluminumService = AluminumService;
