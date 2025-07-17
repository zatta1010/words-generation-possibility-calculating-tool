document.addEventListener('DOMContentLoaded', () => {
    const referenceWordInput = document.getElementById('referenceWord');
    const consonantTypesInput = document.getElementById('consonantTypes');
    const vowelTypesInput = document.getElementById('vowelTypes');
    const syllablesInput = document.getElementById('syllables');
    const levenshteinDistanceLimitInput = document.getElementById('levenshteinDistanceLimit');
    const calculateButton = document.getElementById('calculateButton');

    const totalGeneratedWordsSpan = document.getElementById('totalGeneratedWords');
    const wordsWithinDistanceSpan = document.getElementById('wordsWithinDistance');
    const wordsOutsideDistanceSpan = document.getElementById('wordsOutsideDistance');
    const levDistanceLimitDisplaySpan = document.getElementById('levDistanceLimitDisplay');
    const levDistanceLimitDisplay2Span = document.getElementById('levDistanceLimitDisplay2');

    // レーベンシュタイン距離を計算する関数 (標準的な実装)
    function calculateLevenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix = [];

        // increment along the first column of each row
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // increment each column in the first row
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                const cost = (a.charAt(j - 1) === b.charAt(i - 1)) ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost   // substitution
                );
            }
        }

        return matrix[b.length][a.length];
    }

    // 全てのCV型単語を生成する関数
    function generateCVSyllableWords(numSyllables, consonantTypes, vowelTypes) {
        const generatedWords = [];
        const consonants = Array.from({ length: consonantTypes }, (_, i) => String.fromCharCode(97 + i)); // 'a', 'b', 'c'...
        const vowels = Array.from({ length: vowelTypes }, (_, i) => String.fromCharCode(65 + i)); // 'A', 'B', 'C'...

        // 例: 子音3, 母音2 の場合、consonants = ['a','b','c'], vowels = ['A','B']
        // CV音節の例: aA, aB, bA, bB, cA, cB
        
        // 組み合わせが多すぎる場合の警告閾値
        const MAX_WORDS_LIMIT = 50000; // この数を超えると処理が重くなる可能性

        // 1音節あたりの組み合わせ数
        const combinationsPerCVSyllable = consonants.length * vowels.length;
        if (combinationsPerCVSyllable === 0) return []; // 種類が0なら生成しない

        const totalExpectedWords = Math.pow(combinationsPerCVSyllable, numSyllables);
        if (totalExpectedWords > MAX_WORDS_LIMIT) {
            alert(`警告: 生成される単語の概算数が ${MAX_WORDS_LIMIT} を超える可能性があります (${totalExpectedWords.toLocaleString()}通り)。\nブラウザがフリーズする恐れがあります。入力値を減らしてください。`);
            return []; // 生成を中止
        }


        function generate(currentWord, remainingSyllables) {
            if (remainingSyllables === 0) {
                generatedWords.push(currentWord);
                return;
            }

            for (const c of consonants) {
                for (const v of vowels) {
                    // 各音節は '子音+母音' の形式
                    generate(currentWord + c + v, remainingSyllables - 1);
                }
            }
        }

        generate('', numSyllables); // 初期呼び出し
        return generatedWords;
    }


    calculateButton.addEventListener('click', () => {
        const referenceWord = referenceWordInput.value.trim();
        const numConsonantTypes = parseInt(consonantTypesInput.value);
        const numVowelTypes = parseInt(vowelTypesInput.value);
        const numSyllables = parseInt(syllablesInput.value);
        const levenshteinLimit = parseInt(levenshteinDistanceLimitInput.value);

        if (referenceWord === '') {
            alert('基準単語を入力してください。');
            return;
        }
        if (isNaN(numConsonantTypes) || numConsonantTypes < 1 ||
            isNaN(numVowelTypes) || numVowelTypes < 1 ||
            isNaN(numSyllables) || numSyllables < 1 ||
            isNaN(levenshteinLimit) || levenshteinLimit < 0) {
            alert('すべての数値項目に1以上の有効な数値を入力してください。\n(目標レーベンシュタイン距離は0以上)');
            return;
        }

        // UIの表示をリセット
        totalGeneratedWordsSpan.textContent = '計算中...';
        wordsWithinDistanceSpan.textContent = '計算中...';
        wordsOutsideDistanceSpan.textContent = '計算中...';
        levDistanceLimitDisplaySpan.textContent = levenshteinLimit;
        levDistanceLimitDisplay2Span.textContent = levenshteinLimit;


        console.log('--- 計算開始 ---');
        console.log('基準単語:', referenceWord);
        console.log('子音の種類数:', numConsonantTypes);
        console.log('母音の種類数:', numVowelTypes);
        console.log('音節数:', numSyllables);
        console.log('目標レーベンシュタイン距離:', levenshteinLimit);


        const generatedWords = generateCVSyllableWords(numSyllables, numConsonantTypes, numVowelTypes);
        
        // 生成が中止された場合
        if (generatedWords.length === 0 && Math.pow(numConsonantTypes * numVowelTypes, numSyllables) > 50000) {
             totalGeneratedWordsSpan.textContent = '---';
             wordsWithinDistanceSpan.textContent = '---';
             wordsOutsideDistanceSpan.textContent = '---';
             return;
        }

        console.log('生成された単語の総数:', generatedWords.length);
        totalGeneratedWordsSpan.textContent = generatedWords.length.toLocaleString();

        let countWithinDistance = 0;
        let countOutsideDistance = 0;

        for (const word of generatedWords) {
            const distance = calculateLevenshteinDistance(referenceWord, word);
            if (distance <= levenshteinLimit) {
                countWithinDistance++;
            } else {
                countOutsideDistance++;
            }
        }

        wordsWithinDistanceSpan.textContent = countWithinDistance.toLocaleString();
        wordsOutsideDistanceSpan.textContent = countOutsideDistance.toLocaleString();

        console.log('レーベンシュタイン距離 ≤', levenshteinLimit, 'の単語数:', countWithinDistance);
        console.log('レーベンシュタイン距離 >', levenshteinLimit, 'の単語数:', countOutsideDistance);
        console.log('--- 計算終了 ---');
    });
});