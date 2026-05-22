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
        const aluminumVachPieces = [];
        const aluminumDoPieces = [];
        const aluminumKhungCDPieces = [];
        const aluminumCanhCDPieces = [];
        const aluminumKhungCSPieces = [];
        const aluminumCanhCSPieces = [];
        const beadPieces = {};

        // Mapping từ code sang pieces array
        const codeToArrayMap = {
            "C3209": aluminumVachPieces,
            "C3203": aluminumDoPieces,
            "C3328": aluminumKhungCDPieces,
            "C3303": aluminumCanhCDPieces,
            "C3318": aluminumKhungCSPieces,
            "C8092": aluminumCanhCSPieces
        };

        // Lấy AluminumService để tìm profileCount
        const aluminumService = window.AluminumService;

        customer.sets.forEach((set) => {
            set.segments.forEach((segment) => {
                const lengthMm = Number(segment.lengthMm) || 0;
                const quantity = Number(segment.quantity) || 0;
                const aluminumCode = segment.segmentType;
                if (lengthMm <= 0 || quantity <= 0) return;

                // Lấy array tương ứng với code nhôm
                const targetAluminum = codeToArrayMap[aluminumCode];
                if (!targetAluminum) return;

                // Thêm pieces vào array tương ứng
                for (let i = 0; i < quantity; i += 1) {
                    targetAluminum.push({
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
                            lengthMm,
                            usedMm: lengthMm + EFFECTIVE_KERF_MM
                        });
                    }
                }
            });
        });

        return {
            aluminumVachPieces,
            aluminumDoPieces,
            aluminumKhungCDPieces,
            aluminumCanhCDPieces,
            aluminumKhungCSPieces,
            aluminumCanhCSPieces,
            beadPieces
        };
    }

    function optimizeBars(customer) {

        const {
            aluminumVachPieces,
            aluminumDoPieces,
            aluminumKhungCDPieces,
            aluminumCanhCDPieces,
            aluminumKhungCSPieces,
            aluminumCanhCSPieces,
            beadPieces
        } = buildMaterialPieces(customer);

        const aluminumVach = optimizePieceList(aluminumVachPieces, "Vach");
        const aluminumDo = optimizePieceList(aluminumDoPieces, "Do");
        const aluminumKhungCD = optimizePieceList(aluminumKhungCDPieces, "Khung cua di");
        const aluminumCanhCD = optimizePieceList(aluminumCanhCDPieces, "Canh cua di");
        const aluminumKhungCS = optimizePieceList(aluminumKhungCSPieces, "Khung cua so");
        const aluminumCanhCS = optimizePieceList(aluminumCanhCSPieces, "Canh cua so");

        // Gộp tất cả bead pieces lại thành một mảng duy nhất
        const allBeadPieces = [];
        Object.entries(beadPieces).forEach(([beadCode, beadArray]) => {
            allBeadPieces.push(...beadArray);
        });

        let beadResult = null;
        if (allBeadPieces.length > 0) {
            beadResult = optimizePieceList(allBeadPieces, "Nẹp");
            if (beadResult.error) {
                throw new Error(`${beadResult.label}: ${beadResult.error}`);
            }
        }

        const mainResults = [
            aluminumVach,
            aluminumDo,
            aluminumKhungCD,
            aluminumCanhCD,
            aluminumKhungCS,
            aluminumCanhCS
        ];

        const hasError = mainResults.find((item) => item.error);
        if (hasError) return { error: `${hasError.label}: ${hasError.error}` };

        const totalBeadBars = beadResult ? beadResult.totalBars : 0;
        const totalBeadPieces = beadResult ? beadResult.totalPieces : 0;

        const totalBars =
            aluminumVach.totalBars +
            aluminumDo.totalBars +
            aluminumKhungCD.totalBars +
            aluminumCanhCD.totalBars +
            aluminumKhungCS.totalBars +
            aluminumCanhCS.totalBars +
            totalBeadBars;

        const totalPieces =
            aluminumVach.totalPieces +
            aluminumDo.totalPieces +
            aluminumKhungCD.totalPieces +
            aluminumCanhCD.totalPieces +
            aluminumKhungCS.totalPieces +
            aluminumCanhCS.totalPieces +
            totalBeadPieces;

        const result = {
            kerfUsedMm: EFFECTIVE_KERF_MM,
            totalBars,
            totalPieces,
            aluminumVach,
            aluminumDo,
            aluminumKhungCD,
            aluminumCanhCD,
            aluminumKhungCS,
            aluminumCanhCS
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
