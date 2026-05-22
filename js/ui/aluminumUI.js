const AluminumUI = (() => {
    const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    function renderAluminumList() {
        const container = document.getElementById("aluminumList");
        if (!container) return;

        const aluminumTypes = window.AluminumService.getAluminumTypes();

        if (aluminumTypes.length === 0) {
            container.innerHTML = '<p class="text-slate-500 text-center py-4">Chưa có loại nhôm nào</p>';
            return;
        }

        container.innerHTML = aluminumTypes.map(aluminum => `
            <div class="border border-slate-200 rounded p-4 flex justify-between items-center hover:bg-slate-50">
                <div class="flex-1">
                    <p class="font-semibold text-slate-800">${esc(aluminum.name)}</p>
                    <div class="flex gap-6 text-sm text-slate-600 mt-1">
                        <span>Mã: <strong>${esc(aluminum.code)}</strong></span>
                        <span>Cân nặng: <strong>${aluminum.weightPerMeter} g/m</strong></span>
                        <span>Số lượng nẹp: <strong>${aluminum.profileCount || 0}</strong></span>
                    </div>
                </div>
                <div class="flex gap-2 ml-4">
                    <button onclick="window.editAluminumModal('${esc(aluminum.id)}')" 
                        class="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600" title="Chỉnh sửa">
                        ✏️
                    </button>
                    <button onclick="window.deleteAluminum('${esc(aluminum.id)}')" 
                        class="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600" title="Xóa">
                        🗑️
                    </button>
                </div>
            </div>
        `).join("");
    }

    function showEditModal(aluminumId) {
        const aluminum = window.AluminumService.getAluminumById(aluminumId);
        if (!aluminum) return;

        const newName = prompt("Tên nhôm:", aluminum.name);
        if (newName === null) return;

        const newCode = prompt("Mã nhôm:", aluminum.code);
        if (newCode === null) return;

        const newWeight = prompt("Cân nặng (kg/m):", aluminum.weightPerMeter);
        if (newWeight === null) return;

        const newProfileCount = prompt("Số lượng nẹp:", aluminum.profileCount || 0);
        if (newProfileCount === null) return;

        window.AluminumService.updateAluminum(
            aluminumId,
            newName,
            newCode,
            Number(newWeight),
            Number(newProfileCount)
        ).then(() => {
            renderAluminumList();
            // Refresh tab khách hàng
            if (window.AluminumManager && window.AluminumManager.refreshMainUI) {
                window.AluminumManager.refreshMainUI();
            }
        });
    }

    return {
        renderAluminumList,
        showEditModal
    };
})();

window.AluminumUI = AluminumUI;
