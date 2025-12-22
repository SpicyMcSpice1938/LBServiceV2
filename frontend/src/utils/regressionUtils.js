export const fillMissingYears = (sortedEntries) => {
    const yearsNumericRaw = sortedEntries.map(([year]) => Number(year));
    const minYear = Math.min(...yearsNumericRaw);
    const maxYear = Math.max(...yearsNumericRaw);
    
    const completeEntries = [];
    for (let year = minYear; year <= maxYear; year++) {
        const existing = sortedEntries.find(([y]) => Number(y) === year);
        if (existing) {
            completeEntries.push(existing);
        } else {
            completeEntries.push([String(year), 0]);
        }
    }
    return completeEntries;
};


const transpose = (matrix) => matrix[0].map((_, i) => matrix.map(row => row[i]));

const matrixMultiply = (a, b) => {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a[0].length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
};

const matrixVectorMultiply = (matrix, vector) => 
    matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));

const matrixInverse = (matrix) => {
    const n = matrix.length;
    const identity = matrix.map((row, i) => row.map((_, j) => (i === j ? 1 : 0)));
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
    
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) maxRow = j;
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        
        const pivot = augmented[i][i];
        if (Math.abs(pivot) < 1e-10) throw new Error("Matrix is singular");
        
        for (let j = 0; j < 2 * n; j++) augmented[i][j] /= pivot;
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const factor = augmented[j][i];
                for (let k = 0; k < 2 * n; k++) augmented[j][k] -= factor * augmented[i][k];
            }
        }
    }
    return augmented.map(row => row.slice(n));
};

export const polyRegression = (x, y, deg) => {
    const n = x.length;
    const X = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j <= deg; j++) row.push(Math.pow(x[i], j));
        X.push(row);
    }
    
    const XT = transpose(X);
    const XTX = matrixMultiply(XT, X);
    const XTXinv = matrixInverse(XTX);
    const XTy = matrixVectorMultiply(XT, y);
    return matrixVectorMultiply(XTXinv, XTy);
};