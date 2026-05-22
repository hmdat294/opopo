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
    const unit_price = 148000;
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

    const calcWeight = (type, m) => {
      const baseCode = type === 'nẹp' ? 'beads' : getBaseCode(type);
      
      // Nếu là beads, tính dựa trên originalAluminumCode
      if (baseCode === 'beads' && m.bars && m.bars[0]) {
        const firstPiece = m.bars[0]?.pieces?.[0];
        if (firstPiece?.originalAluminumCode) {
          const origCode = firstPiece.originalAluminumCode;
          return (weight[origCode] || 0) * BAR_LENGTH_MM * (m?.totalBars || 0) / 1000000;
        }
      }
      
      return (weight[baseCode] || 0) * BAR_LENGTH_MM * (m?.totalBars || 0) / 1000000;
    };

    // Tính tổng weight từ tất cả kết quả
    const totalWeight = Object.values(r)
      .filter(item => item && item.bars && Array.isArray(item.bars))
      .reduce((sum, item) => {
        // Tìm code từ pieces
        const firstPiece = item.bars[0]?.pieces?.[0];
        if (firstPiece) {
          return sum + calcWeight(firstPiece.sourceType, item);
        }
        return sum;
      }, 0);

    const mk = (name, code, m, c) => {
      // Handle weight calculation
      let weight_per_meter = 0;
      if (code === 'nẹp' && m.bars && m.bars[0]) {
        const firstPiece = m.bars[0]?.pieces?.[0];
        if (firstPiece?.originalAluminumCode) {
          weight_per_meter = weight[firstPiece.originalAluminumCode] || 0;
        }
      } else {
        const baseCode = getBaseCode(code);
        weight_per_meter = weight[baseCode] || 0;
      }
      
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
      const totalWeight = (weight_per_meter * BAR_LENGTH_MM * m.totalBars / 1000000).toFixed(3);

      return m.totalBars == 0 ? `` : `
        <div class="rounded border p-2">
          <div class="flex justify-between">
            <p class="font-normal">
              ${m.totalBars} ${name} | ${totalLength}mm + ${totalKerf}mm | ${totalWeight}kg
            </p>
          </div>
          ${barsInfo.map((info, idx) => `
            <div class="mt-2">
              <div class="flex h-8 overflow-hidden rounded border">
                ${info.pieces.map((p) => `
                  <div class="${c} flex items-center justify-center border-r px-1 text-md text-white text-center text-xs"
                       style="width:${(p.usedMm / BAR) * 100}%">
                    ${esc(p.setName)} - ${p.lengthMm}mm
                  </div>
                `).join("")}
                ${info.waste > 0 ? `
                  <div class="flex items-center justify-center border-r px-1 text-xs bg-gray-300 text-gray-700"
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
      `<div class="mt-2 rounded border border-emerald-300 bg-emerald-50 p-2 text-md font-medium flex justify-between items-center">
        <p>Tổng ${r.totalBars} thanh | ${totalWeight.toFixed(3)}kg</p>
        <p>${formatted(totalWeight.toFixed(3) * unit_price)}</p>
      </div>  
      <div class="mt-2 space-y-2">
        ${[
          { key: 'aluminumVach', name: 'Vách' },
          { key: 'aluminumDo', name: 'Đỡ' },
          { key: 'aluminumKhungCD', name: 'Khung cửa đi' },
          { key: 'aluminumCanhCD', name: 'Cánh cửa đi' },
          { key: 'aluminumKhungCS', name: 'Khung cửa sổ' },
          { key: 'aluminumCanhCS', name: 'Cánh cửa sổ' },
          { key: 'beads', name: 'Nẹp' }
        ]
          .map(({ key, name }) => {
            const item = r[key];
            if (!item || !item.bars || item.totalBars === 0) return '';
            
            const sourceType = key === 'beads' ? 'nẹp' : item.bars[0]?.pieces?.[0]?.sourceType;
            const baseCode = key === 'beads' ? 'beads' : getBaseCode(sourceType);
            const alum = key === 'beads' ? null : aluminumTypes.find(a => a.code === baseCode);
            
            let displayName = name;
            if (key !== 'beads') {
              displayName = alum?.name || name;
            }
            
            const color = key === 'beads' ? 'bg-yellow-500' : getColorForCode(sourceType);
            return mk(displayName, sourceType, item, color);
          })
          .join("")}
      </div>`;
  }

  function render() {
    const root = document.getElementById("customersContainer");
    if (appState.customers.length === 0) return void (root.innerHTML = `<div class="rounded border bg-white p-3 text-center text-sm">Trống.</div>`);
    root.innerHTML = appState.customers.map((c) => {
      const hasSeg = c.sets.some((s) => s.segments.some((g) => Number(g.lengthMm) > 0 && Number(g.quantity) > 0));
      return `<div class="mb-4 rounded border bg-white p-3 ${c.isCollapsed ? `` : `col-span-3 order-first`}">
        <div class="flex items-center justify-between">
          <b class="cursor-pointer" onclick="toggleCustomerCollapse('${c.id}')">Tên: ${esc(c.name)}</b>
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
              :`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
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
            <input id="setInput_${c.id}" class="flex-1 rounded border px-2 py-1" placeholder="Tên bộ">
            <button class="rounded bg-blue-500 px-2 py-1 text-white" onclick="handleAddSet('${c.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          <div class="mt-2 space-y-2">
            ${c.sets.length === 0 ? `<p class="text-sm italic text-slate-500 text-center">Trống.</p>` : c.sets.map((s) => `
            <div class="rounded border border-dashed bg-slate-50 p-2">
              <div class="mb-2 flex items-center justify-between">
                <b>${esc(s.name)}</b>
                <button class="rounded bg-red-500 px-2 py-1 text-xs text-white" onclick="deleteSet('${c.id}','${s.id}')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                      stroke="currentColor" class="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
              <div class="flex gap-2">
                <input id="segLength_${s.id}" type="number" min="1" max="${BAR_LENGTH_MM}" placeholder="Chiều dài (mm)" class="rounded border px-2 py-1 w-full">
                <input id="segQty_${s.id}" type="number" min="1" value="1" class="rounded border px-2 py-1 w-1/6">
                <select id="segType_${s.id}" class="rounded border px-2 py-1 w-1/4">
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
                  <table class="w-full text-sm">
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
                              onchange="updateSegment('${c.id}','${s.id}','${g.id}','lengthMm',this.value)" class="rounded border px-2 py-1">
                          </td>
                          <td class="px-2">
                            <input type="number" min="1" value="${Number(g.quantity) || 0}" onchange="updateSegment('${c.id}','${s.id}','${g.id}','quantity',this.value)" class="w-full rounded border px-2 py-1">
                          </td>
                          <td class="w-3/12 pr-2">
                            <select onchange="updateSegment('${c.id}','${s.id}','${g.id}','segmentType',this.value)" class="rounded border px-2 py-1 w-full">
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
