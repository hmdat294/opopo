const AluminumManager = (() => {
    async function init() {
        await window.AluminumService.loadAluminumTypes();
        bindEvents();
        window.AluminumUI.renderAluminumList();
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
        if (profileCountNum < 1) {
            alert("Số lượng nẹp phải lớn hơn 0.");
            return;
        }

        window.AluminumService.addAluminum(name, code, Number(weight), profileCountNum)
            .then(() => {
                // Reset form
                document.getElementById("aluminumName").value = "";
                document.getElementById("aluminumCode").value = "";
                document.getElementById("aluminumWeight").value = "";
                document.getElementById("aluminumProfileCount").value = "1";
                
                window.AluminumUI.renderAluminumList();
            })
            .catch(error => {
                console.error('Lỗi:', error);
                alert('Lỗi khi thêm nhôm');
            });
    }

    return { init };
})();

// Global functions for onclick handlers
window.deleteAluminum = (aluminumId) => {
    if (confirm("Bạn chắc chắn muốn xóa loại nhôm này?")) {
        window.AluminumService.deleteAluminum(aluminumId)
            .then(() => {
                window.AluminumUI.renderAluminumList();
            })
            .catch(error => {
                console.error('Lỗi:', error);
                alert('Lỗi khi xóa nhôm');
            });
    }
};

window.editAluminumModal = (aluminumId) => {
    window.AluminumUI.showEditModal(aluminumId);
};

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
    window.AluminumManager.init();
});

window.AluminumManager = AluminumManager;
