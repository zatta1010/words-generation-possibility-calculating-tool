document.addEventListener('DOMContentLoaded', () => {
    const consonantsInput = document.getElementById('consonants');
    const vowelsInput = document.getElementById('vowels');
    const syllablesInput = document.getElementById('syllables');
    const levenshteinInput = document.getElementById('levenshtein');
    const calculateButton = document.getElementById('calculateButton');
    const estimatedLengthSpan = document.getElementById('estimatedLength'); // 表示要素の名前を変更
    const possibleWordsSpan = document.getElementById('possibleWords');

    calculateButton.addEventListener('click', () => {
        const numConsonants = parseInt(consonantsInput.value);
        const numVowels = parseInt(vowelsInput.value);
        const numSyllables = parseInt(syllablesInput.value); // 音節数を取得
        const targetLevenshtein = parseInt(levenshteinInput.value);

        if (isNaN(numConsonants) || numConsonants < 0 ||
            isNaN(numVowels) || numVowels < 0 ||
            isNaN(numSyllables) || numSyllables < 1 || // 音節数は1以上
            isNaN(targetLevenshtein) || targetLevenshtein < 0) {
            alert('すべての入力項目に0以上の有効な数値を入力してください。\n(音節数は1以上)');
            return;
        }

        // --- 概算単語長の決定ロジック ---
        // ここが重要な変更点です。
        // 音節数と子音・母音の数から、単語の概算の長さを決定します。
        // 一般的に、1音節は母音1つと、それに先行する子音で構成されることが多いです (例: CV, V)。
        // 非常に単純化されたモデルとして、
        // 1音節あたり平均2文字 (子音1, 母音1) と仮定し、そこに子音・母音の過不足を補正します。

        let baseLength = 0;
        if (numSyllables > 0) {
            // 音節数に基づいて最低限の長さを計算
            // 例: 3音節なら最低3文字 (V-V-V) または 6文字 (CV-CV-CV)
            // ここでは1音節あたり平均1.5〜2文字程度を想定
            baseLength = Math.ceil(numSyllables * 1.5) + Math.max(0, numConsonants - numVowels);
            // あるいは、子音数と母音数の合計をベースとし、音節数で調整する
            // 例: (numConsonants + numVowels) をそのまま使うか、音節数に合わせて重み付け
            // 今回は、最も単純に子音数 + 母音数 を「基本の文字数」とし、音節数を「単語の構成単位」として別途考慮します。
            baseLength = numConsonants + numVowels; // 基本の文字長はこれまで通り子音+母音
        } else {
            baseLength = numConsonants + numVowels;
        }

        // 音節数を考慮した「推奨される」単語の長さの目安
        // 例えば、音節数3でCV構成なら6文字、V構成なら3文字。
        // ここでは、子音・母音の指定数と音節数の両方を考慮して、単語の長さを「より妥当な範囲」に絞ることを試みます。
        // 「音節数 * 平均文字数/音節」を基準とし、それに子音・母音数を加味
        // 日本語の場合、1音節は通常1-3文字程度 (例: 'あ' (1), 'か' (2), 'ん' (1), 'きょ' (2), 'っか' (3))
        // 最も単純なアプローチとして、母音の数＝音節数 とし、それに子音数を足す方式に戻しつつ、
        // 入力された音節数とは乖離しないように調整します。
        // もし入力された音節数の方が母音数より大きい場合、その差を埋めるために追加の文字（空白、または不定）があると考えます。

        // 新しい単語長推定ロジック (より音節数を重視)
        // 基本的な単語長は音節数 * 2 (子音+母音を想定) とし、
        // 実際の入力子音・母音数がそれとどれくらい違うかを考慮します。
        const estimatedBaseLength = Math.max(numSyllables, numConsonants + numVowels); // 少なくとも音節数か、子音+母音数分の長さ
        
        // 音節の構造を完全にモデル化するのはこのツールの範囲を超えるため、
        // ここでは「単語は平均的に1音節あたりX文字で構成される」という単純な仮定に基づきます。
        // 例えば、日本語では平均1音節あたり約1.5文字～2文字程度と言われます。
        // ここでは便宜上、音節数 * 1.5 と 子音数 + 母音数 の平均を取るか、大きい方を取ります。
        const baseLengthForCalc = Math.ceil((numSyllables * 1.5 + (numConsonants + numVowels)) / 2);
        
        estimatedLengthSpan.textContent = baseLengthForCalc;

        // レーベンシュタイン距離を「単語の長さの許容範囲」として利用
        const minLength = Math.max(0, baseLengthForCalc - targetLevenshtein);
        const maxLength = baseLengthForCalc + targetLevenshtein;

        let totalPossibleCombinations = 0;

        // 考慮する文字の種類
        const numberOfConsonantTypes = 20; // 例: k, s, t, n, h, m, y, r, w, g, z, d, b, p, ch, sh, j, f, ts, h (small variants excluded)
        const numberOfVowelTypes = 5;    // a, i, u, e, o
        const totalCharacterTypes = numberOfConsonantTypes + numberOfVowelTypes;

        for (let currentLength = minLength; currentLength <= maxLength; currentLength++) {
            if (currentLength === 0) continue;

            // 非常に単純化された計算:
            // 各文字位置が子音または母音のどちらかであると仮定し、それぞれの種類の数を乗算
            // 音節構造や子音・母音の厳密な配置ルールはここでは考慮していません。
            // また、指定された子音数と母音数が、この currentLength に「ぴったり」収まる保証もありません。
            // これはあくまで「その長さの文字列がどれだけ作れるか」の概算です。
            const combinationsForCurrentLength = Math.pow(totalCharacterTypes, currentLength);
            totalPossibleCombinations += combinationsForCurrentLength;
        }

        // 非常に大きな数になる可能性があるため、科学的表記に変換
        possibleWordsSpan.textContent = totalPossibleCombinations.toExponential(2); // 小数点以下2桁
    });
});