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

    function start() {
        bindGlobalActions();
        bindTopButtons();
        window.AppData.loadState();
        window.AppUI.render();
    }

    return { start };
})();

window.MainApp = MainApp;
window.MainApp.start();
