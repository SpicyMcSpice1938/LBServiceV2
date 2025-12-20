import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Plot from 'react-plotly.js';

export default function UserStatsPage() {
    const { username } = useParams();
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [error, setError] = useState(null);
    
    // degree currently applied to the fitted plot (only updated when Calculate is clicked)
    const [appliedDegree, setAppliedDegree] = useState(3);


    // sliderDegree reflects the live slider position as the user drags it
    const [sliderDegree, setSliderDegree] = useState(3);
    
    //for line of best fit
    const [fittedValues, setFittedValues] = useState(null);
    const [residuals, setResiduals] = useState(null);
    const [filteredYearsDisplay, setFilteredYearsDisplay] = useState(null);
    const [filteredFreqDisplay, setFilteredFreqDisplay] = useState(null);

    // const [yearBounds, setYearBounds] = useState([0, new Date().getFullYear()])
    const [floor, setFloor] = useState(0)
    const [minYearBound, setMinYearBound] = useState(null);
    const [maxYearBound, setMaxYearBound] = useState(null);

    useEffect(() => {
        const url = import.meta.env.VITE_API_URL;
        
        fetch(`${url}/api/distribution/${username}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setUserStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching user stats:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [username]);

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                Error loading stats: {error}
            </div>
        );
    }

    if (!userStats?.frequencyDistribution) {
        return (
            <div style={{ padding: '20px' }}>
                No frequency distribution data available for {username}
            </div>
        );
    }

    const sortedEntries = Object.entries(userStats.frequencyDistribution)
        .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB));
    
    const years = sortedEntries.map(([year]) => year);
    const freq = sortedEntries.map(([, frequency]) => frequency);
    const yearsNumeric = years.map(y => Number(y));

    const availableMinYear = Math.min(...yearsNumeric);
    const availableMaxYear = Math.max(...yearsNumeric);

    const transpose = (matrix) => {
        return matrix[0].map((_, i) => matrix.map(row => row[i]));
    };

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

    const matrixVectorMultiply = (matrix, vector) => {
        return matrix.map(row => 
            row.reduce((sum, val, i) => sum + val * vector[i], 0)
        );
    };

    const matrixInverse = (matrix) => {
        const n = matrix.length;
        const identity = matrix.map((row, i) => 
            row.map((_, j) => i === j ? 1 : 0)
        );
        const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
        
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = j;
                }
            }
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            
            const pivot = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= pivot;
            }
            
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const factor = augmented[j][i];
                    for (let k = 0; k < 2 * n; k++) {
                        augmented[j][k] -= factor * augmented[i][k];
                    }
                }
            }
        }
        
        return augmented.map(row => row.slice(n));
    };

    const polyRegression = (x, y, deg) => {
        const n = x.length;
        const X = [];
        
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j <= deg; j++) {
                row.push(Math.pow(x[i], j));
            }
            X.push(row);
        }
        
        const XT = transpose(X);
        const XTX = matrixMultiply(XT, X);
        const XTXinv = matrixInverse(XTX);
        const XTy = matrixVectorMultiply(XT, y);
        const coefficients = matrixVectorMultiply(XTXinv, XTy);
        
        return coefficients;
    };

    const handleCalculate = () => {

        //Fill in missing years with zero frequency
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

        // filter based on user (state) defined bounds
        const finalMin = minYearBound ?? availableMinYear;
        const finalMax = maxYearBound ?? availableMaxYear;

        const filteredData = completeEntries.filter(([year]) => {
            const y = Number(year);
            return y >= finalMin && y <= finalMax;
        });

        // Extract final arrays for calculation
        const filteredYears = filteredData.map(([year]) => Number(year));
        const filteredFreq = filteredData.map(([, frequency]) => frequency);
        const filteredYearsStr = filteredData.map(([year]) => year);

        // Validation
        if (filteredYears.length <= sliderDegree) {
            alert(`Not enough data points for degree ${sliderDegree}. Need at least ${sliderDegree + 1} points.`);
            return;
        }

        // Data centering to prevent floating point overflow
        const yearOffset = Math.min(...filteredYears);
        const centeredYears = filteredYears.map(y => y - yearOffset);

        try {
            const coeffs = polyRegression(centeredYears, filteredFreq, sliderDegree);
            
            const fitted = centeredYears.map(x => {
                let value = coeffs.reduce((sum, coeff, i) => sum + coeff * Math.pow(x, i), 0);
                return Math.max(value, floor); // Apply the floor
            });

            const resid = filteredFreq.map((val, i) => val - fitted[i]);

            // Update state
            setFittedValues(fitted);
            setResiduals(resid);
            setFilteredYearsDisplay(filteredYearsStr);
            setFilteredFreqDisplay(filteredFreq);
            setAppliedDegree(sliderDegree);

        } catch (err) {
            console.error("Regression error:", err);
            alert("Calculation failed. Try a lower degree or check your data range.");
        }
    };
    const mainPlotData = [
        {
            x: years,
            y: freq,
            type: 'bar',
            name: 'Frequency',
            marker: {
                color: 'rgb(55, 83, 109)'
            }
        }
    ];

    if (fittedValues) {
        mainPlotData.push({
            x: filteredYearsDisplay || years,
            y: fittedValues,
            type: 'scatter',
            mode: 'lines',
            name: `Polynomial Fit (degree ${appliedDegree})`,
            line: {
                color: 'rgb(255, 65, 54)',
                width: 3
            }
        });
    }

    const residualPlotData = residuals ? [
        {
            x: filteredYearsDisplay || years,
            y: residuals,
            type: 'scatter',
            mode: 'markers',
            name: 'Residuals',
            marker: {
                color: 'rgb(255, 65, 54)',
                size: 6
            }
        },
        {
            x: filteredYearsDisplay || years,
            y: Array((filteredYearsDisplay || years).length).fill(0),
            type: 'scatter',
            mode: 'lines',
            name: 'Zero Line',
            line: {
                color: 'black',
                width: 1,
                dash: 'dash'
            },
            showlegend: false
        }
    ] : [];

    return (
        <div
            className='userStatsDiv'
            style={{
                width: '1200px',            // fixed constant width
                boxSizing: 'border-box',   // include padding in the width so it doesn't grow
                alignContent: 'center',
                justifyContent: 'center',
                margin: '20px auto',       // center with some vertical spacing
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                boxShadow: '0 4px',
                padding: '20px'
            }}
        >
            <div className='regression-controls' style={{
                color: 'black'
            }}>
                
                
                <div className='degreeControls' style={{ marginBottom: '20px' }}>
                    <h3 style={{}}>Polynomial Regression Controls</h3>
                    <label style={{  }}>
                    <span>Polynomial Degree:</span>
                    <span style={{
                        display: 'inline-block',
                        width: '36px',           // fixed width to avoid layout shift
                        textAlign: 'center',
                        fontFamily: 'monospace'
                    }}>
                        {sliderDegree}
                    </span>
                    </label>
                    <input 
                        type="range" 
                        min={0} 
                        max={10}
                        value={sliderDegree}
                        onChange={(e) => setSliderDegree(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div className='floorControls' style={{ marginBottom: '20px' }}>
                    <label style={{}}>
                        <span>Floor Value:</span>
                        <input 
                            type="number" 
                            value={floor}
                            onChange={(e) => setFloor(Number(e.target.value))}
                            style={{ 
                                marginLeft: '10px',
                                padding: '5px',
                                fontSize: '14px',
                                width: '80px'
                            }}
                        />
                    </label>
                </div>

                <div className='yearBoundsControls' style={{ marginBottom: '20px' }}>
                    <label style={{ marginRight: '15px' }}>
                        <span>Min Year:</span>
                        <input 
                            type="number" 
                            value={minYearBound ?? availableMinYear}
                            onChange={(e) => setMinYearBound(e.target.value === '' ? null : Number(e.target.value))}
                            style={{ 
                                marginLeft: '10px',
                                padding: '5px',
                                fontSize: '14px',
                                width: '80px'
                            }}
                            placeholder="All"
                        />
                    </label>
                    <label>
                        <span>Max Year:</span>
                        <input 
                            type="number" 
                            value={maxYearBound ?? availableMaxYear}
                            onChange={(e) => setMaxYearBound(e.target.value === '' ? null : Number(e.target.value))}
                            style={{ 
                                marginLeft: '10px',
                                padding: '5px',
                                fontSize: '14px',
                                width: '80px'
                            }}
                            placeholder="All"
                            max={availableMaxYear ?? new Date().getFullYear}
                        />
                    </label>
                </div>

                <button 
                    onClick={handleCalculate}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                >
                    Calculate
                </button>
            </div>

            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto 20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ width: '100%', margin: '0 auto 20px' }}>
                        <Plot
                            data={mainPlotData}
                            layout={{
                                title: {
                                    text: `Frequency Distribution of ${username}`,
                                    font: { size: 18, color: '#000' },
                                    x: 0.5
                                },
                                xaxis: { title: 'Year' },
                                yaxis: { title: 'Frequency' },
                                font: { color: '#000' },
                                paper_bgcolor: '#fff',
                                plot_bgcolor: '#fff',
                                margin: { t: 80 },
                                autosize: true,
                                showlegend: true
                            }}
                            style={{ width: '100%', margin: '0 auto' }}
                            useResizeHandler={true}
                        />
                    </div>
                     
                    {residuals && (
                        <div style={{ width: '100%', margin: '0 auto' }}>
                            <Plot
                                data={residualPlotData}
                                layout={{
                                    title: {
                                        text: 'Residuals Plot',
                                        font: { size: 16, color: '#000' },
                                        x: 0.5
                                    },
                                    xaxis: { title: 'Year' },
                                    yaxis: { title: 'Residuals', zeroline: true },
                                    font: { color: '#000' },
                                    paper_bgcolor: '#fff',
                                    plot_bgcolor: '#fff',
                                    margin: { t: 70 },
                                    autosize: true,
                                    showlegend: true
                                }}
                                style={{ width: '100%', margin: '0 auto' }}
                                useResizeHandler={true}
                            />
                        </div>
                    )}
                </div>
                {residuals && (
                    <div style={{
                        width: '200px',
                        flexShrink: 0,
                        backgroundColor: '#fff',
                        borderRadius: '4px',
                        padding: '15px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        maxHeight: '1000px',
                        overflowY: 'auto'
                    }}>
                        <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#000' }}>Years by Residual</h4>
                        <div>
                            {residuals.length > 0 && 
                                (filteredYearsDisplay || years)
                                    .map((year, i) => ({ year, residual: residuals[i] }))
                                    .filter((item) => item.residual < 0)
                                    .sort((a, b) => a.residual - b.residual)
                                    .map((item) => (
                                        <div key={item.year} style={{
                                            padding: '8px',
                                            borderBottom: '1px solid #eee',
                                            fontSize: '12px',
                                            color: '#333'
                                        }}>
                                            <div style={{ fontWeight: 'bold' }}>{item.year}</div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                                {item.residual.toFixed(2)}
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>
                    </div>
                )}
            </div>
         </div>
     );
 }