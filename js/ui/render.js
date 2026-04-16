var AppUI = (() => {
  const { appState, BAR_LENGTH_MM, findCustomer } = window.AppData;
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

    const weight = {
      'vách C3209': 4.651,
      'đố C3203': 5.511,
      'nẹp C3295': 1.572,
      'khung cửa đi C3328': 7.291,
      'cánh cửa đi C3303': 8.358,
      'khung cửa sổ C3318': 5.081,
      'cánh cửa sổ C8092': 6.171,
    };

    const calcWeight = (type, m) =>
      (weight[type] || 0) * (m?.totalBars || 0);

    const totalWeight =
      calcWeight("vách C3209", r.aluminumVach) +
      calcWeight("đố C3203", r.aluminumDo) +
      calcWeight("khung cửa đi C3328", r.aluminumKhungCD) +
      calcWeight("cánh cửa đi C3303", r.aluminumCanhCD) +
      calcWeight("khung cửa sổ C3318", r.aluminumKhungCS) +
      calcWeight("cánh cửa sổ C8092", r.aluminumCanhCS) +
      calcWeight("nẹp C3295", r.bead);

    const mk = (t, m, c) => {
      const { totalLength, totalKerf } = m.bars.reduce(
        (acc, b) => {
          const pieces = b.pieces || [];

          const barLength = pieces.reduce(
            (sum, p) => sum + Number(p.lengthMm || 0),
            0
          );

          const barKerf = Math.max(0, pieces.length - 1) * 10;

          acc.totalLength += barLength;
          acc.totalKerf += barKerf;

          return acc;
        },
        { totalLength: 0, totalKerf: 0 }
      );

      const totalWithKerf = totalLength + totalKerf;
      const barsNeeded = Math.ceil(totalWithKerf / BAR);
      const totalCapacity = barsNeeded * BAR;
      const waste = totalCapacity - totalWithKerf;

      return m.totalBars == 0 ? `` : `
        <div class="rounded border p-2">
          <div class="flex justify-between">
            <p class="font-normal">
              ${m.totalBars} ${t} | ${totalLength}mm + ${totalKerf}mm | ${weight[t] * m.totalBars}kg
            </p>
            <p class="font-normal">
             Còn lại ${waste}mm
            </p>
          </div>
          ${m.bars.map((b) => `
            <div class="mt-2">
              <div class="flex h-8 overflow-hidden rounded border">
                ${b.pieces.map((p) => `
                  <div class="${c} flex items-center justify-center border-r px-1 text-md text-white text-center text-xs"
                       style="width:${(p.usedMm / BAR_LENGTH_MM) * 100}%">
                    ${esc(p.setName)} - ${p.lengthMm}mm
                  </div>
                `).join("")}
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
        ${mk("vách C3209", r.aluminumVach, "bg-blue-500")}
        ${mk("đố C3203", r.aluminumDo, "bg-indigo-500")}
        ${mk("khung cửa đi C3328", r.aluminumKhungCD, "bg-red-500")}
        ${mk("cánh cửa đi C3303", r.aluminumCanhCD, "bg-pink-500")}
        ${mk("khung cửa sổ C3318", r.aluminumKhungCS, "bg-yellow-500")}
        ${mk("cánh cửa sổ C8092", r.aluminumCanhCS, "bg-green-500")}
        ${mk("nẹp C3295", r.bead, "bg-emerald-500")}
      </div>`;
  }

  function render() {
    const root = document.getElementById("customersContainer");
    if (appState.customers.length === 0) return void (root.innerHTML = `<div class="rounded border bg-white p-3 text-center text-sm">Trống.</div>`);
    root.innerHTML = appState.customers.map((c) => {
      const hasSeg = c.sets.some((s) => s.segments.some((g) => Number(g.lengthMm) > 0 && Number(g.quantity) > 0));
      return `<div class="mb-4 rounded border bg-white p-3">
        <div class="mb-2 flex items-center justify-between">
          <b>Tên: ${esc(c.name)}</b>
          <div class="flex gap-2">
            ${hasSeg ? `<button class="rounded bg-blue-500 px-2 py-1 text-sm text-white" onclick="renderOptimization('${c.id}')">Tổng số thanh</button>` : ""}
            <button class="rounded bg-emerald-500 px-2 py-1 text-sm text-white" onclick="toggleCustomerCollapse('${c.id}')">
            ${c.isCollapsed ?
          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
          </svg>`
          :
          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" />
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" />
          </svg>`
        }</button>
            <button class="rounded bg-red-500 px-2 py-1 text-sm text-white" onclick="deleteCustomer('${c.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                  stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
        <div id="optimization_${c.id}"></div>
        <div class="mt-2 flex gap-2">
          <input id="setInput_${c.id}" class="flex-1 rounded border px-2 py-1" placeholder="Tên bộ">
          <button class="rounded bg-blue-500 px-2 py-1 text-white" onclick="handleAddSet('${c.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        ${c.isCollapsed ? `` : `
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
                  <option value="vach">Vách</option>
                  <option value="do">Đố</option>
                  <option value="khung_cd">Khung CĐ</option>
                  <option value="canh_cd">Cánh CĐ</option>
                  <option value="khung_cs">Khung CS</option>
                  <option value="canh_cs">Cánh CS</option>
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
                          <td class="w-7/12">
                            <input type="number" min="1" max="${BAR_LENGTH_MM}" value="${Number(g.lengthMm) || 0}" onchange="updateSegment('${c.id}','${s.id}','${g.id}','lengthMm',this.value)" class="w-full rounded border px-2 py-1">
                          </td>
                          <td class="w-2/12 px-2">
                            <input type="number" min="1" value="${Number(g.quantity) || 0}" onchange="updateSegment('${c.id}','${s.id}','${g.id}','quantity',this.value)" class="w-full rounded border px-2 py-1">
                          </td>
                          <td class="w-3/12 pr-2">
                            <select onchange="updateSegment('${c.id}','${s.id}','${g.id}','segmentType',this.value)" class="rounded border px-2 py-1 w-full">
                              <option value="vach" ${g.segmentType === "vach" ? "selected" : ""}>Vách</option>
                              <option value="do" ${g.segmentType === "do" ? "selected" : ""}>Đố</option>
                              <option value="khung_cd" ${g.segmentType === "khung_cd" ? "selected" : ""}>Khung CĐ</option>
                              <option value="canh_cd" ${g.segmentType === "canh_cd" ? "selected" : ""}>Cánh CĐ</option>
                              <option value="khung_cs" ${g.segmentType === "khung_cs" ? "selected" : ""}>Khung CS</option>
                              <option value="canh_cs" ${g.segmentType === "canh_cs" ? "selected" : ""}>Cánh CS</option>
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
