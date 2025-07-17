document.addEventListener('DOMContentLoaded', () => {
    const consonantsInput = document.getElementById('consonants');
    const vowelsInput = document.getElementById('vowels');
    const syllablesInput = document.getElementById('syllables'); // Read-only
    const levenshteinInput = document.getElementById('levenshtein');
    const calculateButton = document.getElementById('calculateButton');
    const totalLengthSpan = document.getElementById('totalLength');
    const possibleWordsSpan = document.getElementById('possibleWords');

    // 母音の入力が変更されたら音節数も更新
    vowelsInput.addEventListener('input', () => {
        syllablesInput.value = vowelsInput.value;
    });

    // 初期表示の更新
    syllablesInput.value = vowelsInput.value;

    calculateButton.addEventListener('click', () => {
        const numConsonants = parseInt(consonantsInput.value);
        const numVowels = parseInt(vowelsInput.value);
        const targetLevenshtein = parseInt(levenshteinInput.value);

        if (isNaN(numConsonants) || numConsonants < 0 ||
            isNaN(numVowels) || numVowels < 0 ||
            isNaN(targetLevenshtein) || targetLevenshtein < 0) {
            alert('すべての入力項目に0以上の有効な数値を入力してください。');
            return;
        }

        // 基準となる単語の長さ（子音数 + 母音数）
        const baseLength = numConsonants + numVowels;
        totalLengthSpan.textContent = baseLength;

        // --- 可能性のある単語の組み合わせ数の概算ロジック ---
        // ここがこのツールの核となる部分です。
        // 実際の単語生成ではないため、あくまで「数学的な組み合わせの数」を概算します。

        // 考慮する文字の種類
        // 例: 日本語の場合、ひらがな、カタカナ、漢字、英字などがありますが、
        // ここでは最も単純に「日本語の子音文字数」と「日本語の母音文字数」を仮定します。
        // 厳密には、ローマ字表記か、かな表記かなどによって大きく変わります。
        // ここでは仮に、一般的な子音と母音の種類数を設定します。
        const numberOfConsonantTypes = 20; // 例: k, s, t, n, h, m, y, r, w, g, z, d, b, p, ch, sh, j, f, ts, h (small variants excluded)
        const numberOfVowelTypes = 5;    // a, i, u, e, o

        // レーベンシュタイン距離を「単語の長さの許容範囲」として利用
        // 例: 目標距離が1の場合、長さが baseLength-1, baseLength, baseLength+1 の単語の組み合わせを考慮
        // minLength は0未満にならないように調整
        const minLength = Math.max(0, baseLength - targetLevenshtein);
        const maxLength = baseLength + targetLevenshtein;

        let totalPossibleCombinations = 0;

        // 各可能な長さについて組み合わせを計算し合算
        // ただし、子音数と母音数の比率を維持することはここでは非常に困難なため、
        // 単純に「可能な長さの範囲内での文字の並びの総数」として概算します。
        // この計算は非常に粗い近似であり、言語学的妥当性はありません。
        // より正確な計算は、辞書、形態素解析、確率モデルなどが必要です。

        for (let currentLength = minLength; currentLength <= maxLength; currentLength++) {
            if (currentLength === 0) continue; // 長さが0の場合は組み合わせなし

            // 非常に単純化された計算:
            // 各文字位置が子音または母音のどちらかであると仮定し、それぞれの種類の数を乗算
            // 例: 長さLの単語の各位置に (numberOfConsonantTypes + numberOfVowelTypes) の選択肢がある
            const totalCharacterTypes = numberOfConsonantTypes + numberOfVowelTypes;
            const combinationsForCurrentLength = Math.pow(totalCharacterTypes, currentLength);
            totalPossibleCombinations += combinationsForCurrentLength;

            // 注意: これはあくまで「文字の並びの総数」であり、
            // 指定された「子音数と母音数」の比率を厳密に守った上での組み合わせではありません。
            // また、音節構造（CVCVなど）も考慮していません。
            // これらを考慮すると、計算は飛躍的に複雑になります。
        }

        // 非常に大きな数になる可能性があるため、科学的表記に変換
        // 例: 1.23e+45
        possibleWordsSpan.textContent = totalPossibleCombinations.toExponential(2); // 小数点以下2桁
    });
});