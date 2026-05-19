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
        window.deleteAluminum = window.CustomerController.deleteAluminum;
        window.editAluminum = window.CustomerController.editAluminum;
    }

    function bindTabButtons() {
        const tabCustomers = document.getElementById("tabCustomers");
        const tabAluminum = document.getElementById("tabAluminum");
        const customersTab = document.getElementById("customersTab");
        const aluminumTab = document.getElementById("aluminumTab");

        tabCustomers.addEventListener("click", () => {
            customersTab.classList.remove("hidden");
            aluminumTab.classList.add("hidden");
            tabCustomers.classList.add("border-b-2", "border-blue-500", "text-slate-700");
            tabCustomers.classList.remove("border-b-0", "text-slate-500");
            tabAluminum.classList.remove("border-b-2", "border-blue-500", "text-slate-700");
            tabAluminum.classList.add("border-b-0", "text-slate-500");
        });

        tabAluminum.addEventListener("click", () => {
            customersTab.classList.add("hidden");
            aluminumTab.classList.remove("hidden");
            tabAluminum.classList.add("border-b-2", "border-blue-500", "text-slate-700");
            tabAluminum.classList.remove("border-b-0", "text-slate-500");
            tabCustomers.classList.remove("border-b-2", "border-blue-500", "text-slate-700");
            tabCustomers.classList.add("border-b-0", "text-slate-500");
            window.AppUI.renderAluminumList();
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

        document.getElementById("addAluminumBtn").addEventListener("click", () => {
            const name = document.getElementById("aluminumName").value.trim();
            const code = document.getElementById("aluminumCode").value.trim();
            const weight = document.getElementById("aluminumWeight").value.trim();

            if (!name || !code || !weight) {
                alert("Vui lòng điền đầy đủ thông tin.");
                return;
            }

            window.CustomerController.addAluminum(name, code, Number(weight));
            document.getElementById("aluminumName").value = "";
            document.getElementById("aluminumCode").value = "";
            document.getElementById("aluminumWeight").value = "";
            window.AppUI.renderAluminumList();
        });
    }

    async function start() {
        await window.AluminumService.loadAluminumTypes();
        bindGlobalActions();
        bindTabButtons();
        bindTopButtons();
        window.AppData.loadState();
        window.AppUI.render();
    }

    return { start };
})();

window.MainApp = MainApp;
window.MainApp.start();
