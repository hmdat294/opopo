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
        const beadPieces = [];

        customer.sets.forEach((set) => {
            set.segments.forEach((segment) => {
                const lengthMm = Number(segment.lengthMm) || 0;
                const quantity = Number(segment.quantity) || 0;
                const segmentType = segment.segmentType;
                if (lengthMm <= 0 || quantity <= 0) return;

                for (let i = 0; i < quantity; i += 1) {

                    const map = {
                        vach: aluminumVachPieces,
                        do: aluminumDoPieces,
                        khung_cd: aluminumKhungCDPieces,
                        canh_cd: aluminumCanhCDPieces,
                        khung_cs: aluminumKhungCSPieces,
                        canh_cs: aluminumCanhCSPieces
                    };

                    const targetAluminum = map[segmentType];

                    if (!targetAluminum) return;

                    targetAluminum.push({
                        setName: set.name,
                        sourceType: segmentType,
                        lengthMm,
                        usedMm: lengthMm + EFFECTIVE_KERF_MM
                    });
                }

                const beadMap = {
                    vach: 1,
                    do: 2,
                    khung_cd: 0,
                    canh_cd: 1,
                    khung_cs: 0,
                    canh_cs: 1
                };

                const beadMultiplier = beadMap[segmentType] ?? 1;
                
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
        const bead = optimizePieceList(beadPieces, "Nep");

        const hasError = [
            aluminumVach,
            aluminumDo,
            aluminumKhungCD,
            aluminumCanhCD,
            aluminumKhungCS,
            aluminumCanhCS,
            bead
        ].find((item) => item.error);

        if (hasError) return { error: `${hasError.label}: ${hasError.error}` };

        const totalBars =
            aluminumVach.totalBars +
            aluminumDo.totalBars +
            aluminumKhungCD.totalBars +
            aluminumCanhCD.totalBars +
            aluminumKhungCS.totalBars +
            aluminumCanhCS.totalBars +
            bead.totalBars;

        const totalPieces =
            aluminumVach.totalPieces +
            aluminumDo.totalPieces +
            aluminumKhungCD.totalPieces +
            aluminumCanhCD.totalPieces +
            aluminumKhungCS.totalPieces +
            aluminumCanhCS.totalPieces +
            bead.totalPieces;

        return {
            kerfUsedMm: EFFECTIVE_KERF_MM,
            totalBars,
            totalPieces,
            aluminumVach,
            aluminumDo,
            aluminumKhungCD,
            aluminumCanhCD,
            aluminumKhungCS,
            aluminumCanhCS,
            bead
        };
    }

    return {
        buildMaterialPieces,
        optimizeBars
    };
})();

window.OptimizationService = OptimizationService;
