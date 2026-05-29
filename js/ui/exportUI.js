const ExportUI = (() => {
    const { appState, BAR_LENGTH_MM, findCustomer } = window.AppData;
    const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    function exportPDF(customerId) {
        const customer = findCustomer(customerId);
        if (!customer) return alert("Không tìm thấy khách hàng");

        const r = window.OptimizationService.optimizeBars(customer);
        if (r.error) return alert("Lỗi: " + r.error);

        const BAR = 5800;
        const BAR_LENGTH_MM = 5800;
        const unit_price = window.AppData.settings.unitPrice;
        const formatted = (money) => new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(money);

        const aluminumTypes = window.AluminumService.getAluminumTypes();
        const weight = {};
        const aluminumNames = {};
        aluminumTypes.forEach(a => {
            weight[a.code] = a.weightPerMeter;
            // aluminumNames[a.code] = a.name;
        });

        function getBaseCode(sourceType) {
            const parts = sourceType.split("_bead_");
            return parts[0];
        }

        const BEAD_CODE = 'C3295';
        let totalWeight = 0;

        Object.values(r)
            .filter(item => item && item.bars && Array.isArray(item.bars))
            .forEach(item => {
                const firstPiece = item.bars[0]?.pieces?.[0];
                if (!firstPiece) return;
                const isBeads = firstPiece.beadAluminumCode || firstPiece.sourceType?.includes('_bead_');
                const baseCode = isBeads ? BEAD_CODE : getBaseCode(firstPiece.sourceType);
                totalWeight += (weight[baseCode] || 0) * BAR_LENGTH_MM * item.totalBars / 1000000;
            });

        const totalCost = (totalWeight.toFixed(3) * unit_price).toFixed(0);

        let html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0 5px 0 0; box-sizing: border-box;}
            body { font-family: 'Segoe UI', 'Arial Unicode MS', sans-serif; background: white; color: #333; }
            
            .header { 
              border-bottom: 3px solid #FF8C00;
              padding: 20px 0;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .company-info { 
              flex: 1;
            }
            
            .company-name {
              font-size: 14px;
              font-weight: bold;
              color: #FF8C00;
              margin-bottom: 5px;
            }
            
            .company-desc {
              font-size: 11px;
              color: #666;
              line-height: 1.4;
            }
            
            .job-info {
              text-align: right;
              font-size: 12px;
            }
            
            .job-info strong {
              font-size: 14px;
              color: #333;
            }
            
            .title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              color: #333;
            }
            
            .subtitle {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            
            .info-box {
              background: #f5f5f5;
              border: 1px solid #ddd;
              padding: 12px;
              margin: 0 0 20px 0;
              border-radius: 4px;
            }
            
            .info-box p {
              font-size: 11px;
              margin: 4px 0;
            }
            
            .section-title {
              background: #FF8C00;
              color: white;
              padding: 8px;
              font-weight: bold;
              font-size: 12px;
              margin: 15px 0 10px 0;
              border-radius: 3px;
            }
            
            .pricing-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #bbb;
              margin-bottom: 15px;
            }
            
            .pricing-table thead {
              background: #34495E;
              color: white;
            }
            
            .pricing-table th {
              padding: 8px;
              text-align: left;
              font-size: 10px;
              font-weight: bold;
              border: 1px solid #999;
            }
            
            .pricing-table td {
              padding: 7px;
              font-size: 9px;
              border: 1px solid #ddd;
            }
            
            .pricing-table tr:nth-child(even) {
              background: #f9f9f9;
            }
            
            .price-column {
              text-align: right;
            }
            
            .aluminum-section {
              margin: 0 0 25px 0;
            }
            
            .aluminum-header {
              padding: 5px 0;
              font-weight: bold;
              font-size: 12px;
            }
            
            .bars-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #bbb;
              border-radius: 4px;
              overflow: hidden;
            }
            
            .bars-table tr {
              border-bottom: 1px solid #ddd;
            }
            
            .bars-table td {
              padding: 8px;
              font-size: 10px;
            }
            
            .bar-viz {
              display: flex;
              align-items: center;
              height: 30px;
              background: white;
              border: 1px solid #ccc;
              border-radius: 3px;
              overflow: visible;
              margin: 5px 0;
              min-width: 0;
              max-width: 100%;
              word-break: break-word;
            }
            
            .bar-piece {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: white;
              font-size: 9px;
              font-weight: bold;
              border-right: 1px solid rgba(255,255,255,0.3);
            }
            
            .bar-waste {
              background: #ddd;
              color: #666;
              display: flex;
              align-items: center;
              justify-content: center;
              border-right: none;
            }
            
            .summary-box {
              background: #ecf0f1;
              border: 2px solid #27ae60;
              padding: 12px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 12px;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
            }
            
            .footer {
              margin-top: 30px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">OPOPO</div>
              <div class="company-desc">
                Hệ thống tối ưu hóa cắt nhôm<br>
                Tính toán và thiết kế cắt hiệu quả
              </div>
            </div>
            <div class="job-info">
              <div><strong>Job: ${customer.name}</strong></div>
              <div>Ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
          
          <div class="title">Bảng Giá Nhôm</div>
          
          <div class="info-box">
            <p><strong>Khách hàng:</strong> ${esc(customer.name)}</p>
            <p><strong>Đơn giá:</strong> ${formatted(unit_price)}/kg</p>
          </div>
    `;

        // Generate color palette
        const colorPalette = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
        ];
        let colorIndex = 0;

        Object.entries(r)
            .filter(([key]) => key !== 'kerfUsedMm' && key !== 'totalBars' && key !== 'totalPieces' && key !== 'error')
            .forEach(([key, item]) => {
                if (!item || !item.bars || item.totalBars === 0) return;

                const isBeads = key === 'beads';
                const sourceType = isBeads ? 'nẹp' : item.bars[0]?.pieces?.[0]?.sourceType;
                const aluminumName = isBeads ? 'Nẹp' : aluminumNames[getBaseCode(sourceType)] || sourceType;

                const barsInfo = item.bars.map((bar, barIdx) => {
                    const pieces = bar.pieces || [];
                    const barLength = pieces.reduce((sum, p) => sum + Number(p.lengthMm || 0), 0);
                    const barKerf = Math.max(0, pieces.length - 1) * 10;
                    const usedMm = barLength + barKerf;
                    const waste = BAR - usedMm;
                    const wastePercent = ((waste / BAR) * 100).toFixed(1);

                    return { pieces, barLength, barKerf, usedMm, waste, wastePercent };
                });

                const totalLength = barsInfo.reduce((sum, info) => sum + info.barLength, 0);
                const totalKerf = barsInfo.reduce((sum, info) => sum + info.barKerf, 0);

                const beadCheck = key === 'beads';
                const baseCode = beadCheck ? BEAD_CODE : getBaseCode(sourceType);

                let itemWeight = (weight[baseCode] || 0) * BAR_LENGTH_MM * item.totalBars / 1000000;
                itemWeight = itemWeight.toFixed(3);

                const wastePercent = (((BAR * item.totalBars - totalLength - totalKerf) / (BAR * item.totalBars)) * 100).toFixed(1);
                const color = colorPalette[colorIndex % colorPalette.length];
                colorIndex++;

                html += `
          <div class="aluminum-section">
            <div class="aluminum-header">
              ${item.label} - Tổng: ${item.totalBars} thanh | ${itemWeight}kg
            </div>
            <table class="bars-table">
              <tbody>
        `;

                barsInfo.forEach((info, idx) => {
                    html += `
            <tr>
              <td style="width: 10%; font-weight: bold;">Thanh ${idx + 1}</td>
              <td style="width: 90%;">
                <div class="bar-viz">
          `;

                    info.pieces.forEach((piece) => {
                        const pieceName = piece.setName || 'N/A';
                        const pieceLength = piece.lengthMm || 0;
                        const piecePercent = (pieceLength / BAR) * 100;
                        html += `
              <div class="bar-piece" style="width: ${piecePercent.toFixed(1)}%; background: ${color}; opacity: 0.8; font-size: 10px;">
                <div style="word-wrap: break-word; white-space: normal; padding: 2px;">
                  <strong>${esc(pieceName)}</strong> - ${pieceLength}mm
                </div>
              </div>
            `;
                    });

                    if (info.waste > 0) {
                        const wastePercent = (info.waste / BAR) * 100;
                        html += `
              <div class="bar-piece bar-waste" style="width: ${wastePercent.toFixed(1)}%; flex-shrink: 0; font-size: 9px;">
                Thừa - ${info.waste}mm
              </div>
            `;
                    }
                });

                html += `
              </tbody>
            </table>
          </div>
        `;
            });

        html += `
          <div style="page-break-before: avoid; margin-top: 30px;">
            <div class="section-title">TỔNG KẾT TỐI ƯU HÓA</div>
          </div>
          <div class="summary-box">
            <div class="summary-row">
              <span>Tổng số thanh:</span>
              <span>${r.totalBars}</span>
            </div>
            <div class="summary-row">
              <span>Tổng khối lượng:</span>
              <span>${totalWeight.toFixed(3)} kg</span>
            </div>
            <div class="summary-row">
              <span>Tổng giá (nhôm):</span>
              <span>${formatted(totalCost)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Báo cáo được tạo bởi hệ thống OPOPO - ${new Date().toLocaleString('vi-VN')}</p>
          </div>
        </body>
      </html>
    `;

        const element = document.createElement('div');
        element.innerHTML = html;
        const opt = {
            margin: [5, 5, 5, 5],
            filename: `Bao-gia-${customer.name}-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        html2pdf().set(opt).from(element).save();
    }

    return { exportPDF };
})();

window.ExportUI = ExportUI;