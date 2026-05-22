const AluminumService = (() => {
    let aluminumTypes = [];
    
    // Detect environment và set API URL
    const getApiUrl = () => {
        if (typeof window !== 'undefined') {
            // Client-side
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:3000/aluminumTypes';
            }
        }
        return '/api/aluminumTypes';
    };
    
    const API_URL = getApiUrl();

    async function loadAluminumTypes() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            aluminumTypes = await response.json();
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

    async function addAluminum(name, code, weightPerMeter, profileCount) {
        const newAluminum = {
            id: `alum_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            name: name.trim(),
            code: code.trim(),
            weightPerMeter: Number(weightPerMeter) || 0,
            profileCount: Number(profileCount) || 1
        };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAluminum)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            aluminumTypes.push(result);
            return result;
        } catch (error) {
            console.error('Lỗi khi thêm nhôm:', error);
            aluminumTypes.push(newAluminum);
            return newAluminum;
        }
    }

    async function updateAluminum(id, name, code, weightPerMeter, profileCount) {
        const aluminum = getAluminumById(id);
        if (!aluminum) return null;
        
        const updated = {
            ...aluminum,
            name: name.trim(),
            code: code.trim(),
            weightPerMeter: Number(weightPerMeter) || 0,
            profileCount: Number(profileCount) || 1
        };
        
        try {
            const response = await fetch(`${API_URL}?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            Object.assign(aluminum, result);
            return result;
        } catch (error) {
            console.error('Lỗi khi cập nhật nhôm:', error);
            Object.assign(aluminum, updated);
            return aluminum;
        }
    }

    async function deleteAluminum(id) {
        const index = aluminumTypes.findIndex(a => a.id === id);
        if (index === -1) return false;
        
        try {
            const response = await fetch(`${API_URL}?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            aluminumTypes.splice(index, 1);
            return true;
        } catch (error) {
            console.error('Lỗi khi xóa nhôm:', error);
            aluminumTypes.splice(index, 1);
            return true;
        }
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
