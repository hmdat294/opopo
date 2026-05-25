const MainApp = (() => {
    function bindGlobalActions() {
        window.deleteCustomer = window.CustomerController.deleteCustomer;
        window.toggleCustomerCollapse = window.CustomerController.toggleCustomerCollapse;
        window.deleteSet = window.CustomerController.deleteSet;
        window.deleteSegment = window.CustomerController.deleteSegment;
        window.updateSegment = window.CustomerController.updateSegment;
        window.handleAddSet = window.AppUI.handleAddSet;
        window.handleAddSegment = window.AppUI.handleAddSegment;
        window.renderOptimization = window.AppUI.renderOptimization;
        window.exportPDF = window.AppUI.exportPDF;
    }

    function bindSettingsModal() {
        const modal = document.getElementById("settingsModal");
        const settingsBtn = document.getElementById("settingsBtn");
        const settingsCancelBtn = document.getElementById("settingsCancelBtn");
        const settingsSaveBtn = document.getElementById("settingsSaveBtn");
        const unitPriceInput = document.getElementById("unitPriceInput");

        settingsBtn.addEventListener("click", () => {
            unitPriceInput.value = window.AppData.settings.unitPrice;
            modal.classList.remove("hidden");
        });

        settingsCancelBtn.addEventListener("click", () => {
            modal.classList.add("hidden");
        });

        settingsSaveBtn.addEventListener("click", () => {
            const price = Number(unitPriceInput.value);
            if (price > 0) {
                window.AppData.settings.unitPrice = price;
                window.AppData.saveSettings();
                window.AppUI.render();
                modal.classList.add("hidden");
            } else {
                alert("Đơn giá phải lớn hơn 0");
            }
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        });
    }

    function bindTopButtons() {
        document.getElementById("addCustomerBtn").addEventListener("click", () => {
            const input = document.getElementById("customerNameInput");
            const name = input.value.trim();
            if (!name) {
                alert("Vui lòng nhập tên khách hàng.");
                return;
            }
            window.CustomerController.createCustomer(name);
            input.value = "";
        });

        document.getElementById("resetAllBtn").addEventListener("click", () => {
            const confirmed = confirm("Bạn chắc chắn muốn xóa toàn bộ dữ liệu?");
            if (!confirmed) return;
            window.CustomerController.resetAll();
        });
    }

    async function start() {
        await window.AluminumService.loadAluminumTypes();
        window.AppData.loadSettings();
        window.AppData.loadState();
        bindGlobalActions();
        bindSettingsModal();
        bindTopButtons();
        window.AppUI.render();
    }

    return { start };
})();

window.MainApp = MainApp;
window.MainApp.start();
