var AppUI = (() => {
  const { appState, BAR_LENGTH_MM, findCustomer } = window.AppData;
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function getAluminumSelectOptions(selectedValue = "") {
    const aluminumTypes = window.AluminumService.getAluminumTypes();
    return aluminumTypes.map(a =>
      `<option value="${a.code}" ${selectedValue === a.code ? "selected" : ""}>${esc(a.name)}</option>`
    ).join("");
  }

  function handleAddSet(customerId) {
    const name = document.getElementById(`setInput_${customerId}`).value.trim();
    if (!name) return alert("Nhập tên bộ.");
    window.CustomerController.addSet(customerId, name);
  }

  function handleAddSegment(customerId, setId) {
    const lengthMm = Number(document.getElementById(`segLength_${setId}`).value);
    const quantity = Number(document.getElementById(`segQty_${setId}`).value);
    const segmentType = String(document.getElementById(`segType_${setId}`).value);
    if (!lengthMm || lengthMm <= 0 || lengthMm > BAR_LENGTH_MM) return alert(`Chiều dài 1-${BAR_LENGTH_MM}mm.`);
    if (!quantity || quantity <= 0) return alert("Số lượng > 0.");
    window.CustomerController.addSegment(customerId, setId, lengthMm, quantity, segmentType);
  }

  function renderOptimization(customerId) {

    const holder = document.getElementById(`optimization_${customerId}`);
    const customer = findCustomer(customerId);
    if (!holder || !customer) return;

    const r = window.OptimizationService.optimizeBars(customer);
    if (r.error) return void (holder.innerHTML = `<div class="mt-2 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-500">${esc(r.error)}</div>`);

    const BAR = 5800;
    const unit_price = window.AppData.settings.unitPrice;
    const formatted = (money) => new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(money);

    // Lấy dữ liệu nhôm từ AluminumService
    const aluminumTypes = window.AluminumService.getAluminumTypes();
    const weight = {};
    aluminumTypes.forEach(a => {
      weight[a.code] = a.weightPerMeter;
    });

    // Helper để lấy base code (ví dụ: "C3209_bead_1" → "C3209")
    function getBaseCode(sourceType) {
      const parts = sourceType.split("_bead_");
      return parts[0];
    }

    // Palette màu và cache
    const colorPalette = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500",
      "bg-orange-500", "bg-teal-500", "bg-lime-500", "bg-sky-500"
    ];
    const colorCache = {};

    function getColorForCode(code) {
      if (!colorCache[code]) {
        const randomIndex = Math.floor(Math.random() * colorPalette.length);
        colorCache[code] = colorPalette[randomIndex];
      }
      return colorCache[code];
    }

    const BEAD_CODE = 'C3295';

    const calcWeight = (type, m) => {
      const isBead = type === 'nẹp' || (type && typeof type === 'string' && type.includes('_bead_'));
      const baseCode = isBead ? BEAD_CODE : getBaseCode(type);
      return (weight[baseCode] || 0) * BAR_LENGTH_MM * (m?.totalBars || 0) / 1000000;
    };

    const totalWeight = Object.values(r)
      .filter(item => item && item.bars && Array.isArray(item.bars))
      .reduce((sum, item) => {
        const firstPiece = item.bars[0]?.pieces?.[0];
        if (!firstPiece) return sum;

        const isBead = firstPiece.beadAluminumCode || firstPiece.sourceType?.includes('_bead_');
        const baseCode = isBead ? BEAD_CODE : getBaseCode(firstPiece.sourceType);
        return sum + (weight[baseCode] || 0) * BAR_LENGTH_MM * item.totalBars / 1000000;
      }, 0);

    const mk = (name, code, m, c) => {
      // Thay toàn bộ block tính weight trong mk:
      const isBead = code === 'nẹp' || (code && typeof code === 'string' && code.includes('_bead_'));
      const baseCode = isBead ? BEAD_CODE : getBaseCode(code);
      const totalWeight = (weight[baseCode] || 0) * BAR_LENGTH_MM * m.totalBars / 1000000;

      // Tính tổng length cho mỗi bar riêng biệt
      const barsInfo = m.bars.map((b) => {
        const pieces = b.pieces || [];
        const barLength = pieces.reduce(
          (sum, p) => sum + Number(p.lengthMm || 0),
          0
        );
        const barKerf = Math.max(0, pieces.length - 1) * 10;
        const usedMm = barLength + barKerf;
        const waste = BAR - usedMm;
        return { usedMm, barLength, barKerf, waste, pieces };
      });

      const totalLength = barsInfo.reduce((sum, info) => sum + info.barLength, 0);
      const totalKerf = barsInfo.reduce((sum, info) => sum + info.barKerf, 0);
      const totalWeightFixed = totalWeight.toFixed(3);

      return m.totalBars == 0 ? `` : `
        <div style="background-color: rgb(51, 65, 85, 0.5);" class="rounded border border-slate-500 p-2">
          <div class="flex justify-between">
            <p class="font-normal text-slate-100">
              ${m.totalBars} ${name} | ${totalWeightFixed}kg
            </p>
          </div>
          ${barsInfo.map((info, idx) => `
            <div class="mt-2">
              <div class="flex h-8 overflow-hidden rounded border border-slate-500">
                ${info.pieces.map((p) => `
                  <div class="${c} flex items-center justify-center border-r border-slate-500 px-1 text-md text-white text-center text-xs"
                       style="width:${(p.usedMm / BAR) * 100}%">
                    ${esc(p.setName)} - ${p.lengthMm}mm
                  </div>
                `).join("")}
                ${info.waste > 0 ? `
                  <div class="flex items-center justify-center border-r border-slate-500 px-1 text-xs bg-slate-800 text-slate-100"
                       style="width:${(info.waste / BAR) * 100}%">
                    Thừa ${info.waste}mm
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>`;
    };

    holder.innerHTML =
      `<div style="background-color: rgb(51, 65, 85, 0.5);" class="mt-2 rounded border border-slate-500 p-2 text-md font-medium flex justify-between items-center text-slate-100">
        <p>Tổng ${r.totalBars} thanh | ${totalWeight.toFixed(3)}kg | đơn giá ${formatted(unit_price)}/kg</p>
        <div class="flex gap-2">
          <p>${formatted(totalWeight.toFixed(3) * unit_price)}</p>
          <button class="rounded bg-blue-500 px-2 py-1 text-xs text-white" onclick="window.ExportUI.exportPDF('${customerId}')" title="Xuất PDF">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      </div>  
      <div class="mt-2 space-y-2">
        ${Object.entries(r)
        .filter(([key]) => key !== 'kerfUsedMm' && key !== 'totalBars' && key !== 'totalPieces' && key !== 'error')
        .map(([key, item]) => {
          if (!item || !item.bars || item.totalBars === 0) return '';

          const isBeads = key === 'beads';
          const sourceType = isBeads ? 'nẹp' : item.bars[0]?.pieces?.[0]?.sourceType;
          const color = isBeads ? 'bg-yellow-500' : getColorForCode(sourceType);

          return mk(item.label, sourceType, item, color);
        })
        .join("")}
      </div>`;
  }

  function render() {
    const root = document.getElementById("customersContainer");
    if (appState.customers.length === 0) return void (root.innerHTML = `<div class="rounded border p-3 text-center text-sm text-slate-100">Trống.</div>`);
    root.innerHTML = appState.customers.map((c) => {
      const hasSeg = c.sets.some((s) => s.segments.some((g) => Number(g.lengthMm) > 0 && Number(g.quantity) > 0));
      return `<div style="background-color: rgb(51, 65, 85, 0.5);" class="mb-4 rounded border border-slate-500 p-3 ${c.isCollapsed ? `` : `col-span-3 order-first`}">
        <div class="flex items-center justify-between">
          <b class="cursor-pointer text-slate-100" onclick="toggleCustomerCollapse('${c.id}')">Tên: ${esc(c.name)}</b>
          <div class="flex gap-2">
            ${hasSeg && !c.isCollapsed ?
          `<button class="rounded bg-blue-500 px-2 py-1 text-sm text-white" onclick="renderOptimization('${c.id}')">
              Tổng số thanh
            </button>` : ""}
            <button class="rounded bg-emerald-500 px-2 py-1 text-sm text-white" onclick="toggleCustomerCollapse('${c.id}')">
              ${c.isCollapsed ?
          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                  </svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" />
              </svg>`}
            </button>
            ${c.isCollapsed ? `` :
          `<button class="rounded bg-red-500 px-2 py-1 text-sm text-white" onclick="deleteCustomer('${c.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>`}
          </div>
        </div>
        <div id="optimization_${c.id}"></div>
        ${c.isCollapsed ? `` : `
          <div class="mt-2 flex gap-2">
            <input id="setInput_${c.id}" class="flex-1 rounded border border-slate-500 border-slate-500 px-2 py-1 bg-slate-800 text-slate-100" placeholder="Tên bộ">
            <button class="rounded bg-blue-500 px-2 py-1 text-white" onclick="handleAddSet('${c.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          <div class="mt-2 space-y-2">
            ${c.sets.length === 0 ? `<p class="text-sm italic text-slate-500 text-center">Trống.</p>` : c.sets.map((s) => `
            <div style="background-color: rgb(51, 65, 85, 0.5);" class="rounded border border-slate-500 p-2">
              <div class="mb-2 flex items-center justify-between">
                <b class="text-slate-100">${esc(s.name)}</b>
                <button class="rounded bg-red-500 px-2 py-1 text-xs text-white" onclick="deleteSet('${c.id}','${s.id}')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                      stroke="currentColor" class="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
              <div class="flex gap-2">
                <input id="segLength_${s.id}" type="number" min="1" max="${BAR_LENGTH_MM}" placeholder="Chiều dài (mm)" class="rounded border border-slate-500 px-2 py-1 w-full bg-slate-800 text-slate-100">
                <input id="segQty_${s.id}" type="number" min="1" value="1" class="rounded border border-slate-500 px-2 py-1 w-1/6 bg-slate-800 text-slate-100">
                <select id="segType_${s.id}" class="rounded border border-slate-500 px-2 py-1 w-1/2 bg-slate-800 text-slate-100">
                  ${getAluminumSelectOptions()}
                </select>
                <button class="rounded bg-blue-500 px-2 py-1 text-white" onclick="handleAddSegment('${c.id}','${s.id}')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                      stroke="currentColor" class="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
              ${s.segments.length === 0 ? `<p class="mt-2 text-sm italic text-slate-500 text-center">Trống.</p>` : `
                <div class="mt-2 overflow-x-auto">
                  <table class="w-full text-sm text-slate-100">
                    <thead>
                      <tr>
                        <th class="w-8/12">Chiều dài</th>
                        <th class="w-1/12">Số lượng</th>
                        <th class="w-2/12">Loại</th>
                        <th class="w-1/12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${s.segments.map((g) => `
                        <tr>
                          <td class="w-full flex gap-2">
                            <input type="range" name="length_mm" min="1" max="${BAR_LENGTH_MM}" value="${Number(g.lengthMm) || 0}"
                              onchange="updateSegment('${c.id}','${s.id}','${g.id}','lengthMm',this.value)" class="w-full">
                            <input type="number" name="length_mm" min="1" max="${BAR_LENGTH_MM}" value="${Number(g.lengthMm) || 0}" 
                              onchange="updateSegment('${c.id}','${s.id}','${g.id}','lengthMm',this.value)" class="rounded border border-slate-500 px-2 py-1 bg-slate-800 text-slate-100">
                          </td>
                          <td class="px-2">
                            <input type="number" min="1" value="${Number(g.quantity) || 0}" onchange="updateSegment('${c.id}','${s.id}','${g.id}','quantity',this.value)" class="w-full rounded border border-slate-500 px-2 py-1 bg-slate-800 text-slate-100">
                          </td>
                          <td class="w-3/12 pr-2">
                            <select onchange="updateSegment('${c.id}','${s.id}','${g.id}','segmentType',this.value)" class="rounded border border-slate-500 px-2 py-1 w-full bg-slate-800 text-slate-100">
                              ${getAluminumSelectOptions(g.segmentType)}
                            </select>
                          </td>
                          <td class="">
                              <button class="rounded bg-red-500 px-2 py-1 text-xs text-white" onclick="deleteSegment('${c.id}','${s.id}','${g.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                  stroke="currentColor" class="size-6">
                                  <path stroke-linecap="round" stroke-linejoin="round"
                                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              `}
            </div>
          `).join("")}
          </div>
        `}
      </div>`;
    }).join("");
  }

  return { render, renderOptimization, handleAddSet, handleAddSegment };
})();

window.AppUI = AppUI;
