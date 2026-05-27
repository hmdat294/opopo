const AluminumService = (() => {
    let aluminumTypes = [];
    
    // JSONBin endpoint
    const API_URL = 'https://api.jsonbin.io/v3/b/6a0fd8eaee5a733b12fd2029';
    const API_KEY = '$2a$10$UYIF4qD14K7VjKd.t7YRduvRNGS2JVp4OHtjxfTJi8Un9/o3cn7wO';

    async function loadAluminumTypes() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let responseData = await response.json();
            
            // Extract data from JSONBin response (data is in 'record' property)
            let data = responseData.record || [];
            
            if (Array.isArray(data)) {
                aluminumTypes = data;
            } else {
                aluminumTypes = [];
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu nhôm:', error);
            aluminumTypes = [];
        }
    }

    function getAluminumTypes() {
        return [...aluminumTypes.reverse()];
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
            profileCount: Number(profileCount) || 0
        };
        try {
            aluminumTypes.push(newAluminum);
            
            // Send updated array to JSONBin
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(aluminumTypes)
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
            profileCount: Number(profileCount) || 0
        };
        
        try {
            Object.assign(aluminum, updated);
            
            // Update entire array in JSONBin
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(aluminumTypes)
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
            
            // Update array in JSONBin after deletion
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(aluminumTypes)
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
