const OptimizationService = (() => {
    const { BAR_LENGTH_MM, KERF_MM } = window.AppData;
    const EFFECTIVE_KERF_MM = KERF_MM / 2;

    function optimizePieceList(pieces, materialLabel) {
        const invalidPiece = pieces.find((piece) => piece.usedMm > BAR_LENGTH_MM);
        if (invalidPiece) {
            return {
                label: materialLabel,
                error: `Doan ${invalidPiece.lengthMm}mm (bo ${invalidPiece.setName}) vuot qua thanh ${BAR_LENGTH_MM}mm sau khi tru mat cat ${EFFECTIVE_KERF_MM}mm.`
            };
        }

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
        const beadPieces = [];

        customer.sets.forEach((set) => {
            set.segments.forEach((segment) => {
                const lengthMm = Number(segment.lengthMm) || 0;
                const quantity = Number(segment.quantity) || 0;
                const segmentType = segment.segmentType === "do" ? "do" : "vach";
                if (lengthMm <= 0 || quantity <= 0) return;

                for (let i = 0; i < quantity; i += 1) {
                    const targetAluminum = segmentType === "do" ? aluminumDoPieces : aluminumVachPieces;
                    targetAluminum.push({
                        setName: set.name,
                        sourceType: segmentType,
                        lengthMm,
                        usedMm: lengthMm + EFFECTIVE_KERF_MM
                    });
                }

                const beadMultiplier = segmentType === "do" ? 2 : 1;
                for (let i = 0; i < quantity * beadMultiplier; i += 1) {
                    beadPieces.push({
                        setName: set.name,
                        sourceType: segmentType,
                        lengthMm,
                        usedMm: lengthMm + EFFECTIVE_KERF_MM
                    });
                }
            });
        });

        return { aluminumVachPieces, aluminumDoPieces, beadPieces };
    }

    function optimizeBars(customer) {
        const { aluminumVachPieces, aluminumDoPieces, beadPieces } = buildMaterialPieces(customer);
        const aluminumVach = optimizePieceList(aluminumVachPieces, "Nhom vach");
        const aluminumDo = optimizePieceList(aluminumDoPieces, "Nhom do");
        const bead = optimizePieceList(beadPieces, "Nep");

        const hasError = [aluminumVach, aluminumDo, bead].find((item) => item.error);
        if (hasError) {
            return { error: `${hasError.label}: ${hasError.error}` };
        }

        const totalBars = aluminumVach.totalBars + aluminumDo.totalBars + bead.totalBars;
        const totalPieces = aluminumVach.totalPieces + aluminumDo.totalPieces + bead.totalPieces;

        return {
            kerfUsedMm: EFFECTIVE_KERF_MM,
            totalBars,
            totalPieces,
            aluminumVach,
            aluminumDo,
            bead
        };
    }

    return {
        buildMaterialPieces,
        optimizeBars
    };
})();

window.OptimizationService = OptimizationService;
