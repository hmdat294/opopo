const AluminumManager = (() => {
    async function init() {
        await window.AluminumService.loadAluminumTypes();
        bindEvents();
        window.AluminumUI.renderAluminumList();
    }

    // Hàm refresh main UI (tab khách hàng) khi dữ liệu nhôm thay đổi
    async function refreshMainUI() {
        if (window.AppUI && window.AppUI.render) {
            window.AppUI.render();
        }
    }

    function bindEvents() {
        document.getElementById("addAluminumBtn").addEventListener("click", handleAddAluminum);
    }

    function handleAddAluminum() {
        const name = document.getElementById("aluminumName").value.trim();
        const code = document.getElementById("aluminumCode").value.trim();
        const weight = document.getElementById("aluminumWeight").value.trim();
        const profileCount = document.getElementById("aluminumProfileCount").value.trim();

        if (!name || !code || !weight || !profileCount) {
            alert("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        const profileCountNum = Number(profileCount);
        if (profileCountNum < 0) {
            alert("Số lượng nẹp phải là số không âm (tối thiểu 0).");
            return;
        }

        window.AluminumService.addAluminum(name, code, Number(weight), profileCountNum)
            .then(() => {
                // Reset form
                document.getElementById("aluminumName").value = "";
                document.getElementById("aluminumCode").value = "";
                document.getElementById("aluminumWeight").value = "";
                document.getElementById("aluminumProfileCount").value = "0";
                
                window.AluminumUI.renderAluminumList();
                refreshMainUI(); // Refresh tab khách hàng
            })
            .catch(error => {
                console.error('Lỗi:', error);
                alert('Lỗi khi thêm nhôm');
            });
    }

    return { init, refreshMainUI };
})();

// Global functions for onclick handlers
window.deleteAluminum = (aluminumId) => {
    if (confirm("Bạn chắc chắn muốn xóa loại nhôm này?")) {
        window.AluminumService.deleteAluminum(aluminumId)
            .then(() => {
                window.AluminumUI.renderAluminumList();
                window.AluminumManager.refreshMainUI(); // Refresh tab khách hàng
            })
            .catch(error => {
                console.error('Lỗi:', error);
                alert('Lỗi khi xóa nhôm');
            });
    }
};

window.editAluminumModal = (aluminumId) => {
    window.AluminumUI.showEditModal(aluminumId);
    // Delay để đảm bảo edit xong rồi mới refresh
    setTimeout(() => {
        window.AluminumManager.refreshMainUI();
    }, 100);
};

window.editAluminumModal = (aluminumId) => {
    window.AluminumUI.showEditModal(aluminumId);
};

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
    window.AluminumManager.init();
});

window.AluminumManager = AluminumManager;
