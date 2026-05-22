const AluminumService = (() => {
    let aluminumTypes = [];
    
    // API endpoint (dùng serverless function làm proxy)
    const API_URL = '/api/aluminumTypes';

    async function loadAluminumTypes() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
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
            aluminumTypes.push(newAluminum);
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ aluminumTypes })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return newAluminum;
        } catch (error) {
            console.error('Lỗi khi thêm nhôm:', error);
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
            Object.assign(aluminum, updated);
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ aluminumTypes })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return updated;
        } catch (error) {
            console.error('Lỗi khi cập nhật nhôm:', error);
            return updated;
        }
    }

    async function deleteAluminum(id) {
        const index = aluminumTypes.findIndex(a => a.id === id);
        if (index === -1) return false;
        
        try {
            aluminumTypes.splice(index, 1);
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ aluminumTypes })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
