const OptimizationService = (() => {
    const { BAR_LENGTH_MM, KERF_MM } = window.AppData;
    const EFFECTIVE_KERF_MM = KERF_MM / 2;

    function optimizePieceList(pieces, materialLabel) {
        const invalidPiece = pieces.find((piece) => piece.usedMm > BAR_LENGTH_MM);
        if (invalidPiece) return {
            label: materialLabel,
            error: `Doan ${invalidPiece.lengthMm}mm (bo ${invalidPiece.setName}) vuot qua thanh ${BAR_LENGTH_MM}mm sau khi tru mat cat ${EFFECTIVE_KERF_MM}mm.`
        };

        pieces.sort((a, b) => b.usedMm - a.usedMm);
        const bars = [];

        pieces.forEach((piece) => {
            let selectedBar = null;
            let smallestRemainAfterFit = Number.POSITIVE_INFINITY;

            bars.forEach((bar) => {
                if (bar.remainingMm >= piece.usedMm) {
                    const remainAfterFit = bar.remainingMm - piece.usedMm;
                    if (remainAfterFit < smallestRemainAfterFit) {
                        smallestRemainAfterFit = remainAfterFit;
                        selectedBar = bar;
                    }
                }
            });

            if (!selectedBar) {
                selectedBar = {
                    id: `bar_${bars.length + 1}`,
                    pieces: [],
                    usedMm: 0,
                    remainingMm: BAR_LENGTH_MM
                };
                bars.push(selectedBar);
            }

            selectedBar.pieces.push(piece);
            selectedBar.usedMm += piece.usedMm;
            selectedBar.remainingMm -= piece.usedMm;
        });

        return {
            label: materialLabel,
            bars,
            totalBars: bars.length,
            totalPieces: pieces.length
        };
    }

    function buildMaterialPieces(customer) {
        // Tự động group segments theo code thay vì hardcoded
        const materialPiecesMap = {}; // { "C3209": [...], "C3203": [...], ... }
        const beadPieces = {}; // { "C3209_bead_1": [...], ... }

        const aluminumService = window.AluminumService;

        customer.sets.forEach((set) => {
            set.segments.forEach((segment) => {
                const lengthMm = Number(segment.lengthMm) || 0;
                const quantity = Number(segment.quantity) || 0;
                const aluminumCode = segment.segmentType;
                if (lengthMm <= 0 || quantity <= 0) return;

                // Initialize array nếu chưa tồn tại
                if (!materialPiecesMap[aluminumCode]) {
                    materialPiecesMap[aluminumCode] = [];
                }

                // Thêm pieces cho nhôm chính
                for (let i = 0; i < quantity; i += 1) {
                    materialPiecesMap[aluminumCode].push({
                        setName: set.name,
                        sourceType: aluminumCode,
                        lengthMm,
                        usedMm: lengthMm + EFFECTIVE_KERF_MM
                    });
                }

                // Thêm bead pieces dựa vào profileCount
                const aluminum = aluminumService.getAluminumByCode(aluminumCode);
                const profileCount = aluminum?.profileCount || 0;

                // Tạo nẹp riêng cho mỗi profile
                for (let beadIdx = 1; beadIdx <= profileCount; beadIdx++) {
                    const beadCode = `${aluminumCode}_bead_${beadIdx}`;
                    if (!beadPieces[beadCode]) {
                        beadPieces[beadCode] = [];
                    }
                    
                    for (let i = 0; i < quantity; i += 1) {
                        beadPieces[beadCode].push({
                            setName: set.name,
                            sourceType: beadCode,
                            originalAluminumCode: aluminumCode,
                            beadAluminumCode: 'C3295',
                            lengthMm,
                            usedMm: lengthMm + EFFECTIVE_KERF_MM
                        });
                    }
                }
            });
        });

        return {
            materialPiecesMap,
            beadPieces
        };
    }

    function optimizeBars(customer) {
        const {
            materialPiecesMap,
            beadPieces
        } = buildMaterialPieces(customer);

        // Tối ưu hóa từng nhôm chính
        const materialResults = {};
        Object.entries(materialPiecesMap).forEach(([aluminumCode, pieces]) => {
            const aluminum = window.AluminumService.getAluminumByCode(aluminumCode);
            const name = aluminum?.name || aluminumCode;
            materialResults[aluminumCode] = optimizePieceList(pieces, name);
        });

        // Check errors từ các nhôm chính
        const mainResults = Object.values(materialResults);
        const hasError = mainResults.find((item) => item.error);
        if (hasError) return { error: `${hasError.label}: ${hasError.error}` };

        // Gộp tất cả bead pieces lại
        const allBeadPieces = [];
        Object.entries(beadPieces).forEach(([beadCode, beadArray]) => {
            allBeadPieces.push(...beadArray);
        });

        let beadResult = null;
        if (allBeadPieces.length > 0) {
            beadResult = optimizePieceList(allBeadPieces, "nẹp kính 3295");
            if (beadResult.error) {
                throw new Error(`${beadResult.label}: ${beadResult.error}`);
            }
        }

        // Tính tổng
        let totalBars = 0;
        let totalPieces = 0;
        
        Object.values(materialResults).forEach(result => {
            totalBars += result.totalBars;
            totalPieces += result.totalPieces;
        });

        if (beadResult) {
            totalBars += beadResult.totalBars;
            totalPieces += beadResult.totalPieces;
        }

        // Build result object
        const result = {
            kerfUsedMm: EFFECTIVE_KERF_MM,
            totalBars,
            totalPieces,
            ...materialResults
        };

        if (beadResult) {
            result.beads = beadResult;
        }

        return result;
    }

    return {
        buildMaterialPieces,
        optimizeBars
    };
})();

window.OptimizationService = OptimizationService;
