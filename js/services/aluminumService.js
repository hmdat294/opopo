const AluminumService = (() => {
    let aluminumTypes = [];
    
    // JSONBin configuration
    const JSONBIN_BIN_ID = '6a0fd8eaee5a733b12fd2029';
    const JSONBIN_KEY = '$2a$10$UYIF4qD14K7VjKd.t7YRduvRNGS2JVp4OHtjxfTJi8Un9/o3cn7wO';
    const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

    const headers = {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
    };

    async function loadAluminumTypes() {
        try {
            const response = await fetch(JSONBIN_URL, {
                method: 'GET',
                headers: {
                    'X-Master-Key': JSONBIN_KEY
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            // JSONBin returns { record: {...}, metadata: {...} }
            aluminumTypes = data.record?.aluminumTypes || [];
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
            const response = await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers,
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
            const response = await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers,
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
            const deleted = aluminumTypes.splice(index, 1);
            const response = await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers,
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
