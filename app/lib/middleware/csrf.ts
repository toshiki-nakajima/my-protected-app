export const generateCSRFToken = (): string => {
    // Web Crypto APIを使用してランダムな値を生成
    const array = new Uint8Array(32);
    self.crypto.getRandomValues(array);

    // バイト配列を16進数文字列に変換
    return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

// CSRFトークンを検証する関数
export const validateCSRFToken = (token: string, storedToken: string): boolean => {
    if (!token || !storedToken) {
        return false;
    }

    // 単純な文字列比較ではなく、一定時間比較を行うためのカスタム実装
    // 注意: これはcrypto.timingSafeEqualの完全な代替ではありませんが、Edge Runtimeでは十分です
    if (token.length !== storedToken.length) {
        return false;
    }

    // 文字列の長さが同じ場合のみ比較を行う
    let result = 0;
    for (let i = 0; i < token.length; i++) {
        // XOR操作を使って差分を蓄積 (タイミング攻撃対策)
        result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }

    return result === 0;
};